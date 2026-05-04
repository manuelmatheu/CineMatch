// Letterboxd ingestion: RSS fetch via /api/rss-proxy, RSS XML parsing,
// CSV parsing, and merge logic. All work happens client-side except the
// RSS fetch (which has to be proxied server-side because Letterboxd
// doesn't return CORS headers).

/**
 * Fetches the user's last ~50 watches from Letterboxd via the proxy
 * and returns them as parsed entries. Throws on non-200.
 */
export async function fetchRssEntries(username) {
  const r = await fetch(`/api/rss-proxy?username=${encodeURIComponent(username)}`);
  if (!r.ok) {
    let msg = `RSS fetch failed: HTTP ${r.status}`;
    try {
      const body = await r.json();
      if (body.error) msg = body.error;
    } catch { /* not JSON, fall through */ }
    throw new Error(msg);
  }
  const xml = await r.text();
  return parseRssXml(xml);
}

/**
 * Parses Letterboxd RSS XML into our internal entry shape.
 * Uses the browser's DOMParser. Per CLAUDE.md, the title field is
 * unreliable for ratings — we read <letterboxd:memberRating> directly.
 */
export function parseRssXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Could not parse RSS XML from Letterboxd');
  }

  const entries = [];
  // Use getElementsByTagNameNS for the letterboxd: namespace because
  // querySelector with escaped colons is fragile across browsers.
  const items = doc.getElementsByTagName('item');

  for (const item of items) {
    const lbx = (tag) => {
      const el = item.getElementsByTagName(`letterboxd:${tag}`)[0];
      return el ? el.textContent?.trim() || null : null;
    };
    const plain = (tag) => {
      const el = item.getElementsByTagName(tag)[0];
      return el ? el.textContent?.trim() || null : null;
    };

    const title = lbx('filmTitle');
    const yearRaw = lbx('filmYear');
    const ratingRaw = lbx('memberRating');
    const watched = lbx('watchedDate');
    const rewatch = lbx('rewatch');

    if (!title) continue; // skip non-watch items (lists, reviews-only, etc.)

    entries.push({
      title,
      year: yearRaw ? Number(yearRaw) : null,
      // RSS rating is absent for unrated films — keep as null, NOT 0.
      rating: ratingRaw ? Number(ratingRaw) : null,
      watched_date: watched,
      rewatch: rewatch === 'Yes',
      letterboxd_uri: plain('link'),
      tmdb_id: null,
      source: 'rss',
    });
  }
  return entries;
}

/**
 * Parses a Letterboxd diary CSV export into entries.
 * Letterboxd CSVs have these columns:
 *   Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags, Watched Date, Review
 */
export function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvRow(lines[0]);
  const idx = (name) => header.indexOf(name);

  const colName = idx('Name');
  const colYear = idx('Year');
  const colRating = idx('Rating');
  const colDate = idx('Date');
  const colWatched = idx('Watched Date');
  const colRewatch = idx('Rewatch');
  const colUri = idx('Letterboxd URI');

  if (colName === -1 || colYear === -1) {
    throw new Error('CSV is missing required columns (Name, Year). Is this a Letterboxd diary export?');
  }

  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (!row[colName]) continue;
    entries.push({
      title: row[colName],
      year: row[colYear] ? Number(row[colYear]) : null,
      // CSV rating is empty for unrated — null, not 0.
      rating: row[colRating] ? Number(row[colRating]) : null,
      watched_date: row[colWatched] || row[colDate] || null,
      rewatch: row[colRewatch] === 'Yes',
      letterboxd_uri: colUri >= 0 ? row[colUri] || null : null,
      tmdb_id: null,
      source: 'csv',
    });
  }
  return entries;
}

/**
 * Tiny CSV-row parser handling quoted fields and embedded "" escapes.
 * Letterboxd CSVs are well-formed (no embedded newlines in fields), so
 * a per-line parser suffices.
 */
function parseCsvRow(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === ',') { out.push(cur); cur = ''; }
      else if (c === '"') { inQuotes = true; }
      else { cur += c; }
    }
  }
  out.push(cur);
  return out;
}

/**
 * Merges RSS + CSV entries.
 *
 * Per CLAUDE.md merging rule: CSV is the source of truth for full history;
 * RSS is the source of truth for the most recent ~50 (it may include
 * watches not yet in a stale CSV). Deduplication is by (title + year),
 * case-insensitive on title.
 *
 * The merge takes CSV entries first, then overlays RSS entries — RSS wins
 * on conflicts for whatever data it provides, but we keep CSV-only fields
 * (e.g. older watches not present in RSS).
 */
export function mergeHistory(rssEntries, csvEntries) {
  const map = new Map();
  const keyOf = (e) => `${(e.title || '').toLowerCase().trim()}__${e.year || '?'}`;

  for (const e of csvEntries) map.set(keyOf(e), e);
  for (const e of rssEntries) {
    const key = keyOf(e);
    const existing = map.get(key);
    map.set(key, existing ? { ...existing, ...e } : e);
  }

  return Array.from(map.values()).sort((a, b) => {
    // Most-recent-watched first; null dates sink to the bottom.
    if (!a.watched_date && !b.watched_date) return 0;
    if (!a.watched_date) return 1;
    if (!b.watched_date) return -1;
    return b.watched_date.localeCompare(a.watched_date);
  });
}
