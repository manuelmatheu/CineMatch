// Background TMDB resolver. Walks watch_history and resolves each entry
// to a TMDB id + poster_path so the UI can render real posters.
//
// Phase 2 minimum: just /search/movie → tmdb_id, poster_path, release_date.
// Phase 2b will fetch /movie/{id} for genres + credits used by the taste
// profile (Phase 3) and recommendations (Phase 4).
//
// Rate limiting: TMDB allows 40 req/10s. We use 300ms between requests
// (~33/10s) which leaves headroom for the user's other browser activity
// and any retries triggered by 429 responses (handled inside searchMovie).

import { storage } from './storage.js';
import { searchMovie } from './tmdb.js';

const MIN_DELAY_MS = 300;
const SAVE_EVERY = 10;
const PROGRESS_EVENT = 'cinematch:resolution-progress';

let running = false;

/** True iff a resolver pass is currently in flight. */
export function isResolving() { return running; }

/**
 * Resolves every history entry that doesn't yet have a tmdb_id.
 * Saves history to localStorage every SAVE_EVERY entries so progress
 * survives a tab close. Dispatches 'cinematch:resolution-progress'
 * after each save so the UI can re-render with the new posters.
 */
export async function resolveHistory() {
  if (running) return;
  running = true;

  const token = storage.getToken();
  if (!token) {
    running = false;
    return;
  }

  const history = storage.getHistory();
  const unresolved = history.filter((e) => e.tmdb_id == null);

  if (unresolved.length === 0) {
    running = false;
    emit({ done: 0, total: 0, finished: true });
    return;
  }

  emit({ done: 0, total: unresolved.length, finished: false });

  let done = 0;

  for (const entry of unresolved) {
    try {
      const result = await searchMovie(entry.title, entry.year, token);
      if (result) {
        entry.tmdb_id = result.id;
        entry.poster_path = result.poster_path || null;
        // Backfill year if Letterboxd didn't provide one (rare).
        if (!entry.year && result.release_date) {
          entry.year = Number(result.release_date.slice(0, 4)) || null;
        }
      } else {
        // Mark as unresolvable so we don't re-search this title forever.
        entry.tmdb_id = -1;
      }
    } catch (err) {
      // Network or auth error — leave tmdb_id null so we retry next session.
      // Don't break the loop; the next entry might work.
      console.warn('[CineMatch] resolver failed for', entry.title, err);
    }

    done++;
    if (done % SAVE_EVERY === 0) {
      storage.setHistory(history);
      emit({ done, total: unresolved.length, finished: false });
    }

    await sleep(MIN_DELAY_MS);
  }

  storage.setHistory(history);
  emit({ done, total: unresolved.length, finished: true });
  running = false;
}

function emit(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail }));
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export const RESOLVER_PROGRESS_EVENT = PROGRESS_EVENT;
