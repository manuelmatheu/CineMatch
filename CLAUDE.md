# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

CineMatch is a personal movie recommendation web app. It reads the user's Letterboxd diary via RSS feed + a one-time CSV export, crosses that history with TMDB to understand taste, and surfaces personalized recommendations (similar films + upcoming releases filtered by genre/director affinity).

Deployed via GitHub + Vercel. Vanilla JS, no framework, no bundler.

**Current state (Phase 0 shipped):** the project shell is up and renders all 8 mobile-first screens against fixture data — no real Letterboxd / TMDB integration yet. The "Project Structure" section below is now mostly real; only `modules/letterboxd.js`, `modules/tmdb.js`, `modules/taste.js`, `modules/recommendations.js`, and `api/rss-proxy.js` remain to be built (Phase 1+).

## Design system

The visual system was designed in [Claude Design](https://claude.ai/design) and ported here. The bundle (chat transcript + React prototype) is preserved at `docs/reference/cinematch/` as design history — read it before changing tokens or layouts.

- **Direction:** editorial neo-noir — deep ink (`#0a0a0c`) + bone (`#f4efe6`) + projector amber accent (oklch).
- **Tokens:** `tokens.css` — palette, type scale, 4px spacing, radii, motion easings, dark/light theme. Source of truth; never hardcode hex.
- **Component classes:** `style.css` — BEM-ish names prefixed `m-` (`m-shell`, `m-header`, `m-poster`, `m-card`, `m-tabbar`, `m-detail-hero`, `m-tonight`, `m-rail`, `m-grid`, `m-taste__*`, `m-setup__*`).
- **Type:** Instrument Serif italic (display), Inter (body), JetBrains Mono (catalog metadata + eyebrows).
- **Posters** are intentional striped placeholders right now (`.m-poster` + `.placeholder-poster` from tokens.css). Phase 2+ swaps in TMDB poster URLs — see `modules/ui.js → poster()`.

---

## Commands

No build step, no bundler, no test runner — by design. Workflow is:

| Task | Command |
|---|---|
| Run locally (with serverless functions) | `vercel dev` |
| Syntax-check a JS file before committing | `node --check path/to/file.js` |
| Deploy preview | push to a branch (Vercel auto-deploys) |
| Deploy production | merge/push to `main` |

If an actual test setup is added later, document the runner here. Until then, validation is manual: open the Vercel dev URL, walk through the data flows in the next section.

---

## Stack

- **Frontend:** Vanilla JS + HTML/CSS (zero dependencies — no framework, no bundler)
- **Data source A:** Letterboxd RSS feed (`https://letterboxd.com/{username}/rss/`) — live, last ~50 entries
- **Data source B:** Letterboxd CSV export — full history, loaded once, stored in `localStorage`
- **Movie metadata + recommendations:** TMDB API v3 (free, non-commercial)
- **RSS proxy:** Vercel serverless function (Letterboxd RSS has CORS restrictions)
- **Deployment:** Vercel (static + serverless functions)
- **Repo:** GitHub, auto-deploy on `main`

**No Supabase.** This is a solo personal app — no realtime, no multi-user. All state lives in `localStorage`.

---

## Project Structure

```
cinematch/
├── CLAUDE.md
├── ROADMAP.md
├── index.html            # App shell
├── app.js                # Bootstrap + view routing
├── style.css             # Global styles + design tokens
├── modules/
│   ├── letterboxd.js     # RSS parsing + CSV ingestion + history merging
│   ├── tmdb.js           # All TMDB API calls (search, details, recommendations, upcoming)
│   ├── taste.js          # Genre/director affinity scoring from watch history
│   ├── recommendations.js # Recommendation engine (merges TMDB results + taste profile)
│   └── ui.js             # Card rendering, filters, toasts, loading states
├── api/
│   └── rss-proxy.js      # Vercel serverless: fetches Letterboxd RSS, returns XML/JSON
├── data/
│   └── .gitkeep          # CSV files go here locally, never committed
├── docs/
│   ├── letterboxd-rss-fields.md
│   ├── tmdb-endpoints.md
│   └── taste-algorithm.md
├── .env.example
└── vercel.json
```

---

## Non-Negotiables

- **TMDB API key lives in `.env` only, never in client-side JS.** All TMDB calls that require the key go through... actually no: TMDB allows direct browser calls with a Bearer token. The key goes in `localStorage` after first setup, and is sent as a header. Never hardcoded in source.
- **Letterboxd RSS cannot be fetched directly from the browser (CORS).** Always proxy through `/api/rss-proxy.js`.
- **TMDB has a rate limit of 40 requests per 10 seconds.** Batch calls carefully. Cache all TMDB responses in `localStorage` with a TTL of 24 hours. Never re-fetch what's already cached.
- **No CSV files committed to the repo.** The `data/` folder is gitignored. CSVs are user-provided and loaded via file input in the UI.
- **No framework, no bundler.** Vanilla ES modules only (`<script type="module">`). If you want to add a dependency, ask first.

---

## Key Data Flows

### A — First-time setup
1. User enters their Letterboxd username → saved to `localStorage`
2. User enters their TMDB API key (read token) → saved to `localStorage`
3. User optionally uploads their Letterboxd CSV export → parsed, merged with RSS, stored in `localStorage` as `watch_history`
4. App fetches RSS via proxy → top ~50 entries merged into `watch_history`

### B — Taste profile generation (`modules/taste.js`)
From `watch_history`, compute:
- **Genre affinity:** weighted count of genres, where weight = user's Letterboxd rating (1–5). High-rated genres score higher.
- **Director affinity:** same logic. Cross with TMDB credits endpoint.
- **Decade preference:** distribution of watched films by decade.
- Output: a `TasteProfile` object stored in `localStorage`, regenerated when history updates.

### C — Recommendations (`modules/recommendations.js`)
For each highly-rated film (≥ 3.5★) in recent history (last 30 watched):
1. Call `GET /movie/{tmdb_id}/recommendations` → deduplicated pool
2. Filter out films already in `watch_history`
3. Score each candidate against `TasteProfile` (genre overlap, director match)
4. Sort by score, show top 20

### D — Upcoming releases
1. Call `GET /movie/upcoming` (TMDB, region-aware)
2. Filter by genres present in top 5 of `TasteProfile.genres`
3. Show as a separate "Coming Soon" section

---

## Letterboxd RSS Fields

The RSS feed at `https://letterboxd.com/{username}/rss/` includes these useful fields per entry:

```xml
<title>Your Name - ★★★★</title>
<letterboxd:watchedDate>2024-11-15</letterboxd:watchedDate>
<letterboxd:rewatch>No</letterboxd:rewatch>
<letterboxd:filmTitle>Your Name</letterboxd:filmTitle>
<letterboxd:filmYear>2016</letterboxd:filmYear>
<letterboxd:memberRating>4.0</letterboxd:memberRating>
<link>https://letterboxd.com/manuelmatheu/film/your-name/</link>
```

`memberRating` is the numeric rating (0.5–5.0). It is **absent** if the user didn't rate the film — treat missing rating as `null`, not 0.

### Letterboxd CSV Export Fields

```
Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date,Review
2024-11-15,Your Name,2016,https://letterboxd.com/film/your-name/,4,No,,2024-11-15,
```

Rating is 0.5–5.0 or empty. CSV is the source of truth for full history; RSS is the source of truth for recency.

**Merging rule:** prefer CSV for historical data; prefer RSS for the 50 most recent entries (RSS may have entries not yet in a stale CSV). Deduplicate by `(filmTitle + filmYear)`.

---

## TMDB Integration

Base URL: `https://api.themoviedb.org/3`
Auth: Bearer token in `Authorization` header (read access token, not API key)

Key endpoints used:
- `GET /search/movie?query={title}&year={year}` → find TMDB ID from Letterboxd title
- `GET /movie/{id}` → full metadata (genres, runtime, tagline, director via credits)
- `GET /movie/{id}/credits` → cast + crew (extract director)
- `GET /movie/{id}/recommendations` → TMDB's recommendation engine (better than /similar)
- `GET /movie/upcoming?region=AR` → upcoming releases, Argentina region
- `GET /configuration` → image base URLs (fetch once, cache)

**Image URLs:** `{base_url}{size}{poster_path}` where size is typically `w500`.

**Title search gotcha:** TMDB search is fuzzy but not perfect. Always search with both title + year. If no result, retry with title only. If still no result, log to console and skip (don't crash).

---

## localStorage Schema

```js
{
  "cinematch_username": "manuelmatheu",
  "cinematch_tmdb_token": "...",
  "cinematch_watch_history": [
    {
      "title": "Your Name",
      "year": 2016,
      "rating": 4.0,          // null if unrated
      "watched_date": "2024-11-15",
      "rewatch": false,
      "source": "csv" | "rss",
      "tmdb_id": 372058,       // null until resolved
      "letterboxd_uri": "https://letterboxd.com/film/your-name/"
    }
  ],
  "cinematch_taste_profile": { ... },   // regenerated on demand
  "cinematch_tmdb_cache": { ... },      // keyed by tmdb_id, expires in 24h
  "cinematch_last_rss_fetch": 1234567890
}
```

---

## Letterboxd Watchlist Linking

The app has no write access to Letterboxd (no API). Instead, each recommendation card has an "Add to Watchlist" button that opens the film's Letterboxd page directly, where the user can add it with one click.

### Strategy: two-tier linking

**Tier 1 — Direct film page (preferred)**
Films that already exist in the user's Letterboxd history (from CSV or RSS) have a `letterboxd_uri` field. Use that directly: `https://letterboxd.com/film/{slug}/` (extract slug from the URI path). This is always accurate.

For TMDB recommendation candidates that are *not* in the user's history, Letterboxd's film pages follow a predictable but fragile slug pattern. **Do not attempt to construct slugs programmatically** — edge cases (disambiguation year suffix like `scream-2022`, articles, non-ASCII characters, colons) make this unreliable.

**Tier 2 — Letterboxd search fallback (always works)**
For any film without a known Letterboxd URI, use:
```
https://letterboxd.com/search/films/{title}+{year}/
```
Example: `https://letterboxd.com/search/films/The+Substance+2024/`

This always resolves correctly and the user sees the right film as the first result.

### Implementation in `modules/ui.js`

```js
function getLetterboxdLink(film) {
  // Tier 1: known URI from CSV/RSS history
  if (film.letterboxd_uri) {
    return film.letterboxd_uri;
  }
  // Tier 2: search fallback
  const query = encodeURIComponent(`${film.title} ${film.year}`);
  return `https://letterboxd.com/search/films/${query}/`;
}
```

Button behavior: always `target="_blank" rel="noopener"`. Never attempt navigation within the app.

### What NOT to do
- Do NOT try to build Letterboxd slugs from TMDB titles (e.g. lowercasing + replacing spaces with hyphens). It breaks on ~15% of films.
- Do NOT make a HEAD request to `letterboxd.com` from the browser to get the LID — CORS will block it and it's unnecessary for this use case.
- Do NOT show the button as disabled when there's no direct URI — the search fallback always works, so the button is always enabled.

---

## What Claude Gets Wrong on This Project

1. **Fetching Letterboxd RSS directly with `fetch()` from the browser** — CORS will block it. Always go through `/api/rss-proxy.js`.

2. **Treating missing Letterboxd rating as 0** — unrated films should have `rating: null`. This matters for the taste algorithm (don't penalize unrated films as "disliked").

3. **Calling TMDB for every film on every page load** — cache everything in `localStorage` with a 24h TTL. The TMDB rate limit is 40 req/10s which sounds generous but a full history resolution run can easily hit hundreds of calls.

4. **Using `/movie/{id}/similar` instead of `/movie/{id}/recommendations`** — `/similar` is keyword/genre matching only. `/recommendations` uses TMDB's collaborative filtering and is significantly better.

5. **Forgetting the TMDB image configuration call** — image base URLs are not hardcoded. Call `GET /configuration` once, cache the result, use it to build all image URLs.

6. **Parsing the RSS `<title>` field for the rating** — use `<letterboxd:memberRating>` instead. The title field formatting is inconsistent.

7. **Blocking the UI during history resolution** — resolving 200+ films to TMDB IDs can take time. Do it in the background with a progress indicator. Never block rendering.

8. **Adding npm dependencies** — this is a zero-dependency vanilla JS project. No lodash, no axios, no cheerio. Use native `fetch`, `DOMParser`, `Array` methods.
