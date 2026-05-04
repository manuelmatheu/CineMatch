// Recommendations engine — Phase 4.
//
// For each high-rated recent film in the user's history, fetch TMDB's
// /movie/{id}/recommendations, dedupe candidates across anchor films,
// filter out anything already in history, score against the live
// taste profile, and persist the top N to localStorage.
//
// Scoring formula (per ROADMAP.md, simplified for MVP):
//   genre_overlap = sum of taste-profile genre weights for shared genres
//   anchor_bonus  = log(anchor_count + 1) * 0.3
//                   — candidates recommended by multiple of your favourites
//                     are stronger signals than a single-source rec
//   pop_weight    = log(popularity) * 0.05
//                   — slight nudge so noisy long-tail picks don't dominate
//   raw_score     = genre_overlap + anchor_bonus + pop_weight
//
// Director bonus is deferred to Phase 4b — it would require an extra
// /movie/{id} call per candidate (currently we have ~100-200 candidates,
// so that's a 30-60s extra round trip).
//
// Output scores are normalized to a 60–95 % "match" band so the UI
// doesn't show "12% match" on the bottom of the list — even the worst
// rec the engine surfaces is a reasonable suggestion.

import { storage } from './storage.js';
import { getRecommendations as fetchTmdbRecs, TMDB_GENRES } from './tmdb.js';

const MIN_RATING = 3.5;
const MAX_SOURCE_FILMS = 30;
const MAX_RECOMMENDATIONS = 30;
const MIN_DELAY_MS = 300;
const PROGRESS_EVENT = 'cinematch:recommendations-progress';

let running = false;

export function isBuilding() { return running; }
export const RECOMMENDATIONS_PROGRESS_EVENT = PROGRESS_EVENT;

/**
 * Builds the recommendations set and persists to localStorage.
 * Safe to call concurrently — only one build runs at a time.
 *
 * Dispatches PROGRESS_EVENT after each source film is processed so the
 * Feed screen can show a build state ("Fetching candidates 12/30…").
 */
export async function buildRecommendations() {
  if (running) return;
  running = true;
  try {
    const token = storage.getToken();
    const profile = storage.getTasteProfile();
    if (!token || !profile?.ready) return;

    const history = storage.getHistory();
    const seen = new Set(
      history.filter((e) => e.tmdb_id && e.tmdb_id > 0).map((e) => e.tmdb_id)
    );

    const sources = pickSourceFilms(history);
    if (sources.length === 0) {
      // No high-rated films yet → nothing to recommend.
      storage.setRecommendations({ items: [], builtAt: Date.now(), sourceCount: 0, message: 'No films rated 3.5★ or above yet.' });
      emit({ done: 0, total: 0, finished: true });
      return;
    }

    const candidates = await collectCandidates(sources, seen, token);
    const scored = scoreCandidates(candidates, profile);
    const top = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RECOMMENDATIONS);

    const items = normalizeMatchScores(top);

    storage.setRecommendations({
      items,
      builtAt: Date.now(),
      sourceCount: sources.length,
    });
    emit({ done: sources.length, total: sources.length, finished: true });
  } finally {
    running = false;
  }
}

// === Source film selection ============================================
function pickSourceFilms(history) {
  return history
    .filter((e) =>
      typeof e.tmdb_id === 'number' && e.tmdb_id > 0 &&
      typeof e.rating === 'number' && e.rating >= MIN_RATING
    )
    .sort((a, b) => (b.watched_date || '').localeCompare(a.watched_date || ''))
    .slice(0, MAX_SOURCE_FILMS);
}

// === Candidate collection (one /recommendations call per source) ======
async function collectCandidates(sources, seen, token) {
  const candidates = new Map(); // tmdb_id -> candidate object
  let processed = 0;

  for (const source of sources) {
    try {
      const results = await fetchTmdbRecs(source.tmdb_id, token);
      for (const cand of results) {
        if (!cand.id || seen.has(cand.id)) continue;
        const existing = candidates.get(cand.id);
        if (existing) {
          existing.anchorCount += 1;
          // Keep the highest-rated source as the displayed attribution
          if (source.rating > existing.because_rating) {
            existing.because = source.title;
            existing.because_id = source.tmdb_id;
            existing.because_rating = source.rating;
          }
        } else {
          candidates.set(cand.id, {
            tmdb_id: cand.id,
            title: cand.title,
            year: cand.release_date ? Number(cand.release_date.slice(0, 4)) : null,
            poster_path: cand.poster_path || null,
            popularity: cand.popularity || 0,
            vote_average: cand.vote_average || 0,
            genre_ids: cand.genre_ids || [],
            overview: cand.overview || '',
            because: source.title,
            because_id: source.tmdb_id,
            because_rating: source.rating,
            anchorCount: 1,
          });
        }
      }
    } catch (err) {
      console.warn('[CineMatch] recs fetch failed for', source.title, err);
    }
    processed++;
    emit({ done: processed, total: sources.length, finished: false });
    await sleep(MIN_DELAY_MS);
  }
  return Array.from(candidates.values());
}

// === Scoring ===========================================================
function scoreCandidates(candidates, profile) {
  const genreWeight = new Map(profile.topGenres.map((g) => [g.name, g.weight]));

  return candidates.map((c) => {
    const genres = (c.genre_ids || [])
      .map((id) => TMDB_GENRES[id])
      .filter(Boolean);

    const genreOverlap = genres.reduce(
      (sum, g) => sum + (genreWeight.get(g) || 0),
      0
    );
    const anchorBonus = Math.log(c.anchorCount + 1) * 0.3;
    const popWeight = c.popularity > 0 ? Math.log(c.popularity) * 0.05 : 0;

    return {
      ...c,
      genres,
      score: genreOverlap + anchorBonus + popWeight,
      _components: { genreOverlap, anchorBonus, popWeight }, // kept for debug/future "why this score"
    };
  });
}

// Maps raw scores into a 60..95 "match %" band so the UI never shows
// "8% match" on a perfectly-reasonable rec at the bottom of the list.
function normalizeMatchScores(top) {
  if (top.length === 0) return [];
  if (top.length === 1) return [{ ...top[0], match: 0.92 }];

  const max = top[0].score;
  const min = top[top.length - 1].score;
  const range = max - min || 1;

  return top.map((rec) => {
    const norm = (rec.score - min) / range;          // 0..1 within the band
    const match = 0.6 + norm * 0.35;                  // 60..95 %
    return { ...rec, match };
  });
}

function emit(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail }));
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
