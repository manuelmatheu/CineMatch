# CineMatch — Roadmap

Personal movie recommendation engine powered by your Letterboxd history and TMDB.

**Stack:** Vanilla JS · Vercel · TMDB API · Letterboxd RSS + CSV

---

## Constraints & Decisions

| Decision | Choice | Reason |
|---|---|---|
| Framework | None (vanilla JS) | Consistency with PlexNight, zero build complexity |
| State | `localStorage` only | Solo personal app, no auth needed |
| Realtime | None | Not needed |
| TMDB auth | Bearer token in localStorage | TMDB allows direct browser calls |
| RSS fetch | Vercel serverless proxy | Letterboxd has CORS restrictions |
| History source | CSV (full) + RSS (recent) | RSS alone is only ~50 films, insufficient for taste modeling |
| Recommendation engine | TMDB `/recommendations` + local taste scoring | Best available without Letterboxd API access |

---

## Phase 0 — Repo & Infrastructure

*Do this before writing any app code.*

- [ ] Create GitHub repo (`cinematch`)
- [ ] Connect to Vercel, configure auto-deploy on `main`
- [ ] Create `vercel.json` with function routing
- [ ] Create `.env.example` with all required keys
- [ ] Scaffold directory structure per `CLAUDE.md`
- [ ] Confirm `vercel dev` works locally

**Exit criteria:** `vercel dev` serves `index.html`. Push to `main` deploys to Vercel URL. No app logic yet.

**`vercel.json` skeleton:**
```json
{
  "functions": {
    "api/*.js": { "runtime": "nodejs18.x" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

---

## Phase 1 — Setup & Data Ingestion

*Users provide their Letterboxd username, TMDB token, and optional CSV.*

### 1.1 — Onboarding Screen
- [ ] Input: Letterboxd username (saved to localStorage)
- [ ] Input: TMDB Read Access Token (saved to localStorage)
- [ ] Validate TMDB token by calling `GET /configuration`
- [ ] File input: upload Letterboxd CSV export (optional but recommended)
- [ ] Show clear instructions on how to get TMDB token and export CSV

### 1.2 — RSS Proxy (`/api/rss-proxy.js`)
- [ ] Accept `?username={username}` query param
- [ ] Fetch `https://letterboxd.com/{username}/rss/`
- [ ] Return the XML as-is (or parse to JSON — decide once, document in CLAUDE.md)
- [ ] Basic validation: return 400 if username is missing, 502 if Letterboxd is unreachable

### 1.3 — History Ingestion (`modules/letterboxd.js`)
- [ ] Parse RSS XML using `DOMParser` — extract: `filmTitle`, `filmYear`, `memberRating`, `watchedDate`, `rewatch`, `link`
- [ ] Parse CSV using native string splitting — extract same fields from CSV columns
- [ ] Merge RSS + CSV: deduplicate by `(title + year)`, prefer RSS for recent 50
- [ ] Store merged array as `cinematch_watch_history` in localStorage
- [ ] Show count: "X films loaded (Y from CSV, Z from RSS)"

**Exit criteria:** User completes setup. `localStorage` contains their full watch history. Console shows clean merge with no duplicates.

---

## Phase 2 — TMDB Resolution

*Resolve every Letterboxd film to a TMDB ID. This is the foundation for everything else.*

- [ ] Background worker loop: iterate `watch_history` where `tmdb_id === null`
- [ ] For each film: `GET /search/movie?query={title}&year={year}`
- [ ] Match heuristic: pick the result where title + year match exactly. If no exact match, retry without year. If still no match, mark as `tmdb_id: -1` (unresolvable) and skip.
- [ ] Fetch `GET /movie/{id}` for each resolved film → store genres, director, runtime in the history entry
- [ ] Cache all TMDB responses in `cinematch_tmdb_cache` with 24h TTL
- [ ] Show progress bar during resolution: "Resolving 234/412 films…"
- [ ] Rate limit: max 35 requests per 10 seconds (leave buffer below the 40 limit)

**Exit criteria:** 90%+ of films in history have a valid `tmdb_id`. Resolution runs in background without blocking the UI.

---

## Phase 3 — Taste Profile

*Derive the user's genre and director affinity from their rated history.*

Implemented in `modules/taste.js`. All logic is pure functions — no side effects, easy to test.

- [ ] `buildTasteProfile(watchHistory)` → returns `TasteProfile`
- [ ] **Genre scoring:** for each film with a rating, add `rating` to each of its genres' score. Normalize to 0–1.
- [ ] **Director scoring:** same logic — weighted by rating, normalized.
- [ ] **Decade distribution:** count films per decade (1970s, 80s, 90s, 00s, 10s, 20s), normalize.
- [ ] **Minimum data threshold:** if fewer than 10 rated films, show a warning "Add more ratings on Letterboxd for better recommendations."
- [ ] Store `TasteProfile` in `cinematch_taste_profile` localStorage. Regenerate when history changes.
- [ ] Display profile summary in UI: top 5 genres, top 5 directors, favorite decade.

**Exit criteria:** `buildTasteProfile()` returns a valid profile from test data. UI shows a readable taste summary.

---

## Phase 4 — Recommendations Engine

*The main feature: "because you liked X, watch Y".*

Implemented in `modules/recommendations.js`.

### 4.1 — Candidate Generation
- [ ] Take the 30 most recently watched films with rating ≥ 3.5★
- [ ] For each: `GET /movie/{tmdb_id}/recommendations` (paginated, page 1 only = 20 results)
- [ ] Deduplicate candidates across all source films
- [ ] Filter out films already in `watch_history`

### 4.2 — Candidate Scoring
- [ ] For each candidate, fetch `GET /movie/{id}` (use cache if available)
- [ ] Score = genre overlap with TasteProfile + director bonus + popularity weight
- [ ] Genre overlap: sum of TasteProfile scores for each shared genre
- [ ] Director bonus: +0.5 if director is in TasteProfile top 10
- [ ] Popularity weight: `Math.log(popularity) * 0.1` (slight boost, don't let it dominate)

### 4.3 — UI
- [ ] Grid of movie cards: poster, title, year, score indicators
- [ ] Each card shows: "Because you liked [source film]" attribution
- [ ] Filter chips: genre filters derived from TasteProfile top genres
- [ ] Click a card → expand to show: synopsis, director, TMDB rating, trailer link (if available)
- [ ] "Already seen this" button → adds to watch_history as unrated, removes from recommendations
- [ ] **"Add to Watchlist" button** → opens Letterboxd in a new tab
  - If film has a `letterboxd_uri` (from user's history): opens `https://letterboxd.com/film/{slug}/` directly
  - Otherwise: opens `https://letterboxd.com/search/films/{Title+Year}/` as fallback
  - Button always enabled — search fallback works for 100% of films
  - See `CLAUDE.md → Letterboxd Watchlist Linking` for implementation details

**Exit criteria:** Recommendations are personalized and clearly different from generic "top movies" lists.

---

## Phase 5 — Upcoming Releases

*Surface relevant new releases based on taste.*

- [ ] `GET /movie/upcoming?region=AR&language=es-AR` (or `en-US` — let user choose)
- [ ] Filter by: genres in user's top 5 TasteProfile genres
- [ ] Secondary filter: any director in user's TasteProfile top 10
- [ ] Show as a horizontal scroll row: "Coming soon you might like"
- [ ] Each card: poster, title, release date, matching genres highlighted
- [ ] Refresh upcoming list weekly (TTL in cache)

**Exit criteria:** Upcoming section shows films genuinely aligned with user taste, not just blockbusters.

---

## Phase 6 — Polish & PWA

- [ ] Offline support: service worker caches app shell + cached TMDB data
- [ ] Add to Home Screen (PWA manifest)
- [ ] Dark mode (should be default given the cinematic aesthetic)
- [ ] Manual refresh: "Sync with Letterboxd" button → re-fetches RSS + re-resolves new films
- [ ] Re-upload CSV: allow updating the CSV without losing cache
- [ ] Export: download current recommendations as a shareable Letterboxd list format (CSV)
- [ ] Error states: graceful handling if TMDB is unreachable, if RSS fails, if CSV is malformed

---

## Open Questions

1. **Language/region for TMDB:** `/movie/upcoming?region=AR` returns Argentine releases. Is that what you want, or prefer US release dates as reference?

2. **Unrated films in taste modeling:** films you watched but didn't rate — include them with a neutral weight (2.5★ equivalent), or exclude them entirely? Including gives more data but dilutes signal.

3. **How to handle rewatches:** if you watched a film twice and rated it differently, which rating wins? Last seen, or average?

4. **Recommendation refresh:** how often should recommendations regenerate? On every app open (slow but fresh) or only when new films are added to history?

---

## Effort Estimates (Claude Code sessions)

| Phase | Sessions | Notes |
|---|---|---|
| 0 — Infrastructure | 1 | Pure scaffolding |
| 1 — Ingestion | 2 | RSS proxy + CSV parser + merge logic |
| 2 — TMDB Resolution | 2 | Background worker + rate limiting + caching |
| 3 — Taste Profile | 1 | Pure functions, well-defined |
| 4 — Recommendations | 3 | Most complex phase |
| 5 — Upcoming | 1 | Simpler, reuses phase 4 infrastructure |
| 6 — Polish | 2 | PWA + error states + UX refinement |
| **Total** | **~12** | |
