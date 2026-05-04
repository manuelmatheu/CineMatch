// Background TMDB resolver — two-phase background worker.
//
//   Phase A (posters):     watch_history entries with tmdb_id == null
//                          → /search/movie → tmdb_id, poster_path
//   Phase B (enrichment):  entries with tmdb_id but no genres array
//                          → /movie/{id}?append_to_response=credits
//                          → genres, director(s), runtime, original_language
//
// Phase A unblocks the Diary screen (real posters); Phase B unblocks the
// Taste screen (real genre/director affinity, decade, language stats).
// Each phase saves to localStorage every SAVE_EVERY entries so progress
// survives a tab close, and dispatches 'cinematch:resolution-progress'
// so the UI can re-render incrementally.
//
// Rate limit: TMDB allows 40 req/10s. We use 300ms between requests
// (~33/10s), which leaves headroom for any 429 retries (handled inside
// the tmdb.js call sites with Retry-After).

import { storage } from './storage.js';
import { searchMovie, getMovieWithCredits } from './tmdb.js';
import { buildTasteProfile } from './taste.js';

const MIN_DELAY_MS = 300;
const SAVE_EVERY = 10;
const PROGRESS_EVENT = 'cinematch:resolution-progress';

let running = false;

export function isResolving() { return running; }
export const RESOLVER_PROGRESS_EVENT = PROGRESS_EVENT;

/**
 * Runs both passes in sequence. Safe to call concurrently — only one
 * pass loop runs at a time. Returns when both phases are complete.
 */
export async function resolveHistory() {
  if (running) return;
  running = true;
  try {
    await runPosterPass();
    await runEnrichmentPass();
  } finally {
    running = false;
  }
}

// === Phase A: posters ==================================================
async function runPosterPass() {
  const token = storage.getToken();
  if (!token) return;

  const history = storage.getHistory();
  const todo = history.filter((e) => e.tmdb_id == null);
  if (todo.length === 0) return;

  emit({ phase: 'posters', done: 0, total: todo.length, finished: false });
  let done = 0;

  for (const entry of todo) {
    try {
      const result = await searchMovie(entry.title, entry.year, token);
      if (result) {
        entry.tmdb_id = result.id;
        entry.poster_path = result.poster_path || null;
        if (!entry.year && result.release_date) {
          entry.year = Number(result.release_date.slice(0, 4)) || null;
        }
      } else {
        entry.tmdb_id = -1;
      }
    } catch (err) {
      console.warn('[CineMatch] poster lookup failed for', entry.title, err);
    }

    done++;
    if (done % SAVE_EVERY === 0) {
      storage.setHistory(history);
      emit({ phase: 'posters', done, total: todo.length, finished: false });
    }
    await sleep(MIN_DELAY_MS);
  }

  storage.setHistory(history);
  emit({ phase: 'posters', done, total: todo.length, finished: true });
}

// === Phase B: enrichment ===============================================
async function runEnrichmentPass() {
  const token = storage.getToken();
  if (!token) return;

  const history = storage.getHistory();
  const todo = history.filter(
    (e) => typeof e.tmdb_id === 'number' && e.tmdb_id > 0 && !Array.isArray(e.genres)
  );

  if (todo.length === 0) {
    rebuildTasteProfile();
    return;
  }

  emit({ phase: 'enrichment', done: 0, total: todo.length, finished: false });
  let done = 0;

  for (const entry of todo) {
    try {
      const detail = await getMovieWithCredits(entry.tmdb_id, token);
      if (detail) {
        entry.genres = detail.genres;
        entry.director = detail.director;
        entry.directors = detail.directors;
        entry.runtime = detail.runtime;
        entry.original_language = detail.original_language;
      } else {
        // Movie no longer in TMDB; mark as enriched-with-empties so we
        // don't keep retrying it.
        entry.genres = [];
      }
    } catch (err) {
      console.warn('[CineMatch] enrichment failed for', entry.title, err);
    }

    done++;
    if (done % SAVE_EVERY === 0) {
      storage.setHistory(history);
      rebuildTasteProfile();
      emit({ phase: 'enrichment', done, total: todo.length, finished: false });
    }
    await sleep(MIN_DELAY_MS);
  }

  storage.setHistory(history);
  rebuildTasteProfile();
  emit({ phase: 'enrichment', done, total: todo.length, finished: true });
}

function rebuildTasteProfile() {
  try {
    const profile = buildTasteProfile(storage.getHistory());
    storage.setTasteProfile(profile);
  } catch (err) {
    console.warn('[CineMatch] taste profile rebuild failed', err);
  }
}

function emit(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail }));
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
