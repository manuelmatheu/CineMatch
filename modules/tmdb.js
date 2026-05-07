// TMDB API helpers.
//   Phase 1: validateToken
//   Phase 2: searchMovie + posterUrl (used by modules/resolver.js)
//   Phase 2b+: getMovie, getCredits, /recommendations (later)

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p/';

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

async function tmdbFetch(url, token, attempt = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (r.status === 429 && attempt < MAX_RETRIES) {
      const retry = Number(r.headers.get('Retry-After')) || 1;
      await new Promise((res) => setTimeout(res, retry * 1000));
      return tmdbFetch(url, token, attempt + 1);
    }
    return r;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`TMDB request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * TMDB movie genre IDs → names. IDs are stable; hardcoding saves a
 * /genre/movie/list roundtrip on every cold boot. Used by both the
 * recommendations engine and the upcoming-releases filter to map the
 * `genre_ids` field on lightweight movie list responses to the same
 * genre names that /movie/{id} returns in its enriched form.
 */
export const TMDB_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

/**
 * Validates a TMDB read access token by hitting the lightweight /configuration
 * endpoint. Returns { ok: true } on success, { ok: false, status, message } otherwise.
 */
export async function validateToken(token) {
  if (!token || token.length < 20) {
    return { ok: false, status: 0, message: 'Token looks too short — paste the full read access token.' };
  }
  try {
    const r = await fetch(`${TMDB_BASE}/configuration`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/json',
      },
    });
    if (r.status === 401 || r.status === 403) {
      return { ok: false, status: r.status, message: 'TMDB rejected this token. Double-check you copied the read access token (not the API key).' };
    }
    if (!r.ok) {
      return { ok: false, status: r.status, message: `TMDB returned ${r.status}.` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, status: 0, message: 'Network error talking to TMDB. Check your connection.' };
  }
}

/**
 * Builds a TMDB image URL. Sizes per TMDB image config:
 *   posters: w92, w154, w185, w342, w500, w780, original
 *   w342 is plenty for 2:3 cards on mobile + retina at typical viewport widths.
 */
export function posterUrl(path, size = 'w342') {
  if (!path) return null;
  return `${IMG_BASE}${size}${path}`;
}

/**
 * Searches TMDB for a movie matching `title` (and `year` if provided).
 * Returns the best match or null.
 *
 * Match preference per CLAUDE.md "Title search gotcha":
 *   1. Exact title (case-insensitive) AND year matches release_date prefix
 *   2. Exact title only
 *   3. First result
 *   4. Retry without year if no results
 *
 * Throws on HTTP errors so the caller can decide whether to mark the entry
 * as unresolvable. Handles 429 rate-limit with one Retry-After backoff.
 */
export async function searchMovie(title, year, token) {
  if (!title) return null;
  const params = new URLSearchParams({ query: title, include_adult: 'false' });
  if (year) params.set('year', String(year));

  const r = await tmdbFetch(`${TMDB_BASE}/search/movie?${params}`, token);
  if (!r.ok) throw new Error(`TMDB search failed: HTTP ${r.status}`);

  const data = await r.json();
  const results = data.results || [];
  if (results.length === 0) {
    // Common case: foreign titles where Letterboxd uses the original
    // and TMDB indexes the English release year differently. Retry without year.
    if (year) return searchMovie(title, null, token);
    return null;
  }

  const lcTitle = title.toLowerCase();
  const yearStr = year ? String(year) : null;

  const exactBoth = results.find((m) =>
    (m.title || '').toLowerCase() === lcTitle &&
    yearStr && (m.release_date || '').startsWith(yearStr)
  );
  if (exactBoth) return exactBoth;

  const exactTitle = results.find((m) => (m.title || '').toLowerCase() === lcTitle);
  if (exactTitle) return exactTitle;

  return results[0];
}

/**
 * Fetches the full movie record + credits in a single request.
 * Returns the fields we need for the taste profile, normalized.
 *
 *   { genres: ["Drama", "Romance"],
 *     director: "Charlotte Wells",     // first credited director
 *     directors: ["Charlotte Wells"],  // all of them (handles Coens/Safdies)
 *     runtime: 102,                    // minutes; null if unknown
 *     original_language: "en",         // ISO 639-1
 *     release_date: "2022-10-21" }
 *
 * Returns null on 404; throws on other HTTP errors.
 * Handles 429 with Retry-After backoff (one retry).
 */
export async function getMovieWithCredits(id, token) {
  const url = `${TMDB_BASE}/movie/${id}?append_to_response=credits`;
  const r = await tmdbFetch(url, token);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`TMDB movie ${id} failed: HTTP ${r.status}`);

  const data = await r.json();
  const directors = (data.credits?.crew || [])
    .filter((c) => c.job === 'Director')
    .map((c) => c.name);

  return {
    genres: (data.genres || []).map((g) => g.name),
    director: directors[0] || null,
    directors,
    runtime: data.runtime || null,
    original_language: data.original_language || null,
    release_date: data.release_date || null,
  };
}

/**
 * Fetches TMDB's recommendation candidates for a given film.
 * Used by the recommendations engine (Phase 4) — for each high-rated
 * recent film in the user's history, we pull this list and score the
 * candidates against the taste profile.
 *
 * Returns the raw `results` array (page 1 only, ~20 items per call).
 * Each item carries: id, title, release_date, poster_path, vote_average,
 * popularity, vote_count, genre_ids, original_language, overview.
 *
 * NOTE: per CLAUDE.md, /recommendations is preferred over /similar — it
 * uses TMDB's collaborative filtering, /similar is keyword/genre matching
 * only and produces noticeably weaker picks.
 */
export async function getRecommendations(id, token) {
  const url = `${TMDB_BASE}/movie/${id}/recommendations?page=1`;
  const r = await tmdbFetch(url, token);
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`TMDB recommendations for ${id} failed: HTTP ${r.status}`);
  const data = await r.json();
  return Array.isArray(data.results) ? data.results : [];
}

/**
 * Returns the YouTube watch URL for the best official trailer for `id`.
 * Preference order: official Trailer → official Teaser → any Trailer →
 * any Teaser → first YouTube video. Returns null when nothing is available.
 */
export async function getMovieTrailerUrl(id, token) {
  const r = await tmdbFetch(`${TMDB_BASE}/movie/${id}/videos`, token);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`TMDB videos for ${id} failed: HTTP ${r.status}`);
  const data = await r.json();
  const yt = (data.results || []).filter((v) => v.site === 'YouTube' && v.key);
  if (yt.length === 0) return null;
  const pick =
    yt.find((v) => v.official && v.type === 'Trailer') ||
    yt.find((v) => v.official && v.type === 'Teaser') ||
    yt.find((v) => v.type === 'Trailer') ||
    yt.find((v) => v.type === 'Teaser') ||
    yt[0];
  return `https://www.youtube.com/watch?v=${pick.key}`;
}

/**
 * Fetches a page of TMDB's upcoming-releases list for a given region.
 * Each page returns ~20 entries with the same lightweight shape as
 * /search/movie results (no director, no genre names — just genre_ids).
 *
 * `region` is an ISO 3166-1 country code (e.g. "AR", "US"). The list is
 * scoped to films releasing in that region's theatres, which keeps it
 * relevant rather than showing US-only releases to non-US users.
 */
export async function getUpcoming(region, page, token) {
  const params = new URLSearchParams({ region, page: String(page) });
  const url = `${TMDB_BASE}/movie/upcoming?${params}`;
  const r = await tmdbFetch(url, token);
  if (!r.ok) throw new Error(`TMDB upcoming page ${page} failed: HTTP ${r.status}`);
  const data = await r.json();
  return Array.isArray(data.results) ? data.results : [];
}
