// Upcoming releases — Phase 5.
//
// Pulls the next ~60 theatrical releases for the user's region from
// TMDB, filters them by overlap with the top 5 genres in the live
// taste profile, and surfaces a chronological list.
//
// Cached for 7 days in localStorage so we don't hit TMDB on every
// boot — upcoming-release schedules don't shift hour-to-hour.
//
// Director-affinity secondary filter (per ROADMAP) is deferred — it
// would require an extra /movie/{id} call per candidate and the genre
// filter alone produces a strong, taste-aligned set.

import { storage } from './storage.js';
import { getUpcoming as fetchTmdbUpcoming, TMDB_GENRES } from './tmdb.js';

const REGION = 'AR';                              // matches the design context
const PAGES_TO_FETCH = 3;                         // ~60 candidates before filtering
const MAX_RESULTS = 24;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;     // 7 days
const MIN_DELAY_MS = 300;                         // TMDB throttle (~33/10s)
const PROGRESS_EVENT = 'cinematch:upcoming-progress';

let running = false;

export function isBuilding() { return running; }
export const UPCOMING_PROGRESS_EVENT = PROGRESS_EVENT;

/**
 * Builds the upcoming list. Returns immediately if the cache is still
 * fresh (within CACHE_TTL_MS) unless `force: true`.
 */
export async function buildUpcoming({ force = false } = {}) {
  if (running) return;
  running = true;
  try {
    const cached = storage.getUpcoming();
    if (!force && cached && Date.now() - (cached.builtAt || 0) < CACHE_TTL_MS) {
      emit({ done: PAGES_TO_FETCH, total: PAGES_TO_FETCH, finished: true, cached: true });
      return;
    }

    const token = storage.getToken();
    const profile = storage.getTasteProfile();
    if (!token) return;

    const topGenres = profile?.ready
      ? profile.topGenres.slice(0, 5).map((g) => g.name)
      : [];

    // Fetch pages 1..PAGES_TO_FETCH sequentially with throttling.
    const candidates = [];
    for (let p = 1; p <= PAGES_TO_FETCH; p++) {
      try {
        const page = await fetchTmdbUpcoming(REGION, p, token);
        if (page.length === 0) break;
        candidates.push(...page);
      } catch (err) {
        console.warn('[CineMatch] upcoming page', p, 'failed', err);
        break;
      }
      emit({ done: p, total: PAGES_TO_FETCH, finished: false });
      if (p < PAGES_TO_FETCH) await sleep(MIN_DELAY_MS);
    }

    const items = filterAndSort(candidates, topGenres);

    storage.setUpcoming({
      items,
      builtAt: Date.now(),
      region: REGION,
      sourceCount: candidates.length,
      filteredCount: items.length,
    });
    emit({ done: PAGES_TO_FETCH, total: PAGES_TO_FETCH, finished: true });
  } finally {
    running = false;
  }
}

// === Filtering + reason copy ==========================================
function filterAndSort(rawCandidates, topGenres) {
  const today = new Date().toISOString().slice(0, 10);

  // Dedupe by id; require a release date and a future date.
  const seen = new Set();
  const candidates = rawCandidates.filter((c) => {
    if (!c.id || !c.release_date || c.release_date < today) return false;
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  const scored = candidates.map((c) => {
    const genres = (c.genre_ids || [])
      .map((id) => TMDB_GENRES[id])
      .filter(Boolean);
    const matched = genres.filter((g) => topGenres.includes(g));
    return {
      tmdb_id: c.id,
      title: c.title,
      year: c.release_date ? Number(c.release_date.slice(0, 4)) : null,
      poster_path: c.poster_path || null,
      release_date: c.release_date,
      overview: c.overview || '',
      popularity: c.popularity || 0,
      genres,
      matched,
      reason: buildReason(matched, topGenres),
    };
  });

  // If the user has a taste profile, only show films that hit at least
  // one of their top 5 genres. Otherwise show whatever's upcoming.
  const filtered = topGenres.length > 0
    ? scored.filter((s) => s.matched.length > 0)
    : scored;

  // Chronological — earliest releases first.
  filtered.sort((a, b) =>
    a.release_date.localeCompare(b.release_date) ||
    b.popularity - a.popularity
  );

  return filtered.slice(0, MAX_RESULTS);
}

function buildReason(matched, topGenres) {
  if (matched.length === 0) return 'New release';
  if (matched.length >= 3) return `Matches ${matched.length} of your top genres`;
  if (matched.length === 1 && matched[0] === topGenres[0]) {
    return `${matched[0]} is your top genre`;
  }
  return `Matches ${matched.join(', ')}`;
}

function emit(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail }));
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
