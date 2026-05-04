// User-initiated data actions wired from the More screen.
//
//   syncWithLetterboxd()    — re-fetch RSS and merge new entries.
//   importCsvFile(file)     — merge a freshly-uploaded CSV.
//   exportRecommendationsCsv() — download recs in Letterboxd-list format.
//   resetEverything()       — wipe all localStorage keys.
//
// All merge operations preserve TMDB enrichment (tmdb_id, poster_path,
// genres, director, runtime, original_language) on entries we've already
// resolved — without that, a re-sync would discard hours of background work.

import { storage } from './storage.js';
import { fetchRssEntries, parseCsv } from './letterboxd.js';
import { resolveHistory } from './resolver.js';

/**
 * Re-fetch the user's Letterboxd RSS and merge into the existing history
 * blob. Returns counts: { added, ratingChanged, total }.
 */
export async function syncWithLetterboxd() {
  const username = storage.getUsername();
  if (!username) throw new Error('Letterboxd username not set');

  const fresh = await fetchRssEntries(username);
  const existing = storage.getHistory();
  const result = mergePreservingEnrichment(existing, fresh);

  storage.setHistory(result.merged);
  storage.setLastSync(Date.now());

  // Background-resolve any newly-added entries. The resolver chains
  // recommendations + upcoming so the whole pipeline stays in sync.
  if (result.added > 0) resolveHistory();

  return { added: result.added, ratingChanged: result.ratingChanged, total: result.merged.length };
}

/**
 * Merge a re-uploaded CSV into the existing history. CSVs are the only
 * way to bring in entries older than the last 50 RSS entries.
 */
export async function importCsvFile(file) {
  const text = await file.text();
  const fresh = parseCsv(text);
  const existing = storage.getHistory();
  const result = mergePreservingEnrichment(existing, fresh);

  storage.setHistory(result.merged);

  if (result.added > 0) resolveHistory();

  return { added: result.added, ratingChanged: result.ratingChanged, total: result.merged.length };
}

/**
 * Download the current live recommendations as a CSV with `Title,Year`
 * columns — the format Letterboxd's list importer accepts.
 */
export function exportRecommendationsCsv() {
  const blob = storage.getRecommendations();
  const items = blob?.items || [];
  if (items.length === 0) {
    throw new Error('No recommendations to export yet — wait for the engine to finish.');
  }
  const rows = [
    ['Title', 'Year'],
    ...items.map((r) => [r.title || '', r.year || '']),
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  triggerDownload(csv, `cinematch-recommendations-${dateStamp()}.csv`, 'text/csv');
  return items.length;
}

/**
 * Wipes every CineMatch key from localStorage. Caller is responsible
 * for navigating back to /setup/1 afterwards.
 */
export function resetEverything() {
  storage.reset();
}

// === Internals ========================================================

function mergePreservingEnrichment(existing, fresh) {
  const keyOf = (e) => `${(e.title || '').toLowerCase().trim()}__${e.year || '?'}`;
  const map = new Map();
  for (const e of existing) map.set(keyOf(e), e);

  let added = 0;
  let ratingChanged = 0;

  for (const f of fresh) {
    const key = keyOf(f);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, f);
      added++;
      continue;
    }
    // Keep enrichment fields from `prev`; accept new rating/watched_date
    // from `f` (Letterboxd users edit ratings, and rewatches push the
    // watched_date forward).
    const next = {
      ...prev,
      rating: f.rating ?? prev.rating,
      watched_date: f.watched_date || prev.watched_date,
      rewatch: f.rewatch || prev.rewatch,
      letterboxd_uri: f.letterboxd_uri || prev.letterboxd_uri,
    };
    if (next.rating !== prev.rating) ratingChanged++;
    map.set(key, next);
  }

  const merged = Array.from(map.values()).sort((a, b) => {
    if (!a.watched_date && !b.watched_date) return 0;
    if (!a.watched_date) return 1;
    if (!b.watched_date) return -1;
    return b.watched_date.localeCompare(a.watched_date);
  });

  return { merged, added, ratingChanged };
}

function csvEscape(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function dateStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
