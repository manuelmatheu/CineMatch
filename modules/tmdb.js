// TMDB API helpers.
//   Phase 1: validateToken
//   Phase 2: searchMovie + posterUrl (used by modules/resolver.js)
//   Phase 2b+: getMovie, getCredits, /recommendations (later)

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p/';

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

  const r = await fetch(`${TMDB_BASE}/search/movie?${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (r.status === 429) {
    const retryAfter = Number(r.headers.get('Retry-After')) || 1;
    await new Promise((res) => setTimeout(res, retryAfter * 1000));
    return searchMovie(title, year, token);
  }
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
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (r.status === 429) {
    const retry = Number(r.headers.get('Retry-After')) || 1;
    await new Promise((res) => setTimeout(res, retry * 1000));
    return getMovieWithCredits(id, token);
  }
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
