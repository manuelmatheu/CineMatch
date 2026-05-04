// Taste profile algorithm — pure functions over watch_history.
// Per ROADMAP.md Phase 3:
//   - Genre scoring: rating-weighted, normalized to 0..1
//   - Director scoring: rating-weighted, with min-films threshold
//   - Decade distribution: counts per decade
//   - Languages: percentage breakdown by TMDB original_language
//
// All inputs come from the resolver's enrichment pass (genres, director(s),
// runtime, original_language). Films without those fields are skipped for
// the dimensions that need them but still counted for decade/total stats.

const MIN_RATED_FILMS = 10;
const MIN_DIRECTOR_FILMS = 2;

/**
 * Builds a TasteProfile from the user's watch_history.
 * Returns { ready, ratedCount, message?, topGenres, topDirectors,
 *           decades, runtime, languages, totalEnriched }.
 *
 * `ready === false` means the profile shouldn't be displayed yet —
 * either there isn't enough rated data, or enrichment hasn't run.
 */
export function buildTasteProfile(history) {
  const totalFilms = history.length;
  const enriched = history.filter((e) => Array.isArray(e.genres));
  const rated = enriched.filter((e) => typeof e.rating === 'number' && e.rating > 0);

  if (rated.length < MIN_RATED_FILMS) {
    return {
      ready: false,
      ratedCount: rated.length,
      enrichedCount: enriched.length,
      totalFilms,
      message: rated.length === 0
        ? 'Add ratings on Letterboxd so we can learn your taste.'
        : `Need ${MIN_RATED_FILMS - rated.length} more rated film${MIN_RATED_FILMS - rated.length === 1 ? '' : 's'} to start building your taste profile.`,
    };
  }

  return {
    ready: true,
    ratedCount: rated.length,
    enrichedCount: enriched.length,
    totalFilms,
    topGenres: scoreGenres(rated),
    topDirectors: scoreDirectors(rated),
    decades: countDecades(history),
    runtime: runtimeStats(enriched),
    languages: languageBreakdown(enriched),
  };
}

// === Genres ============================================================
function scoreGenres(rated) {
  const score = new Map();
  const count = new Map();
  for (const film of rated) {
    for (const g of film.genres) {
      score.set(g, (score.get(g) || 0) + film.rating);
      count.set(g, (count.get(g) || 0) + 1);
    }
  }
  const max = Math.max(...score.values(), 1);
  return Array.from(score.entries())
    .map(([name, s]) => ({ name, weight: s / max, count: count.get(name) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);
}

// === Directors =========================================================
// Counts each credited director per film (handles Coens/Safdies/Daniels).
// Filters to directors with ≥ MIN_DIRECTOR_FILMS rated films so a single
// 5-star film doesn't push an unknown director to the top.
function scoreDirectors(rated) {
  const ratings = new Map(); // name -> [rating, rating, ...]
  for (const film of rated) {
    const directors = Array.isArray(film.directors) && film.directors.length
      ? film.directors
      : (film.director ? [film.director] : []);
    for (const name of directors) {
      if (!ratings.has(name)) ratings.set(name, []);
      ratings.get(name).push(film.rating);
    }
  }
  return Array.from(ratings.entries())
    .filter(([, rs]) => rs.length >= MIN_DIRECTOR_FILMS)
    .map(([name, rs]) => ({
      name,
      count: rs.length,
      avgRating: round1(rs.reduce((a, b) => a + b, 0) / rs.length),
    }))
    .sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
    .slice(0, 7);
}

// === Decades ===========================================================
// Counts ALL watched films (not just rated) — this answers "what eras
// do you actually consume?" not "what eras do you rate highly?".
function countDecades(history) {
  const counts = new Map();
  for (const film of history) {
    if (!film.year) continue;
    const decade = `${Math.floor(film.year / 10) * 10}s`;
    counts.set(decade, (counts.get(decade) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));
}

// === Runtime ===========================================================
function runtimeStats(enriched) {
  const runtimes = enriched.map((e) => e.runtime).filter((r) => r > 0);
  if (runtimes.length === 0) return { avg: 0, longest: 0, shortest: 0 };
  return {
    avg: Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length),
    longest: Math.max(...runtimes),
    shortest: Math.min(...runtimes),
  };
}

// === Languages =========================================================
function languageBreakdown(enriched) {
  const counts = new Map();
  for (const film of enriched) {
    if (!film.original_language) continue;
    counts.set(film.original_language, (counts.get(film.original_language) || 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
  const sorted = Array.from(counts.entries())
    .map(([code, count]) => ({
      code,
      name: languageName(code),
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.pct - a.pct);

  // Collapse anything below 5% into a single "Other" bucket so the
  // legend stays readable.
  if (sorted.length <= 6) return sorted;
  const top = sorted.slice(0, 5);
  const otherPct = sorted.slice(5).reduce((s, l) => s + l.pct, 0);
  return [...top, { code: 'other', name: 'Other', pct: otherPct }];
}

// Use the browser's locale-aware language name when available; degrade to
// uppercase ISO code outside browsers. Avoids maintaining our own map.
function languageName(code) {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'language' });
    return dn.of(code) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function round1(n) { return Math.round(n * 10) / 10; }
