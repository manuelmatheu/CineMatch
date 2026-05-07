# CineMatch — Design System Rules (for Figma → code porting)

A focused reference for porting Figma designs into this codebase. Read this when ingesting Figma frames so your output stays consistent with the existing tokens, component classes, and architecture.

For product/brand context (audience, voice, anti-references), see `.impeccable.md`. For functional architecture (data flows, TMDB, Letterboxd ingestion), see `CLAUDE.md`.

---

## 1. Token Definitions

**Source of truth:** `tokens.css` (loaded before `style.css` in `index.html`).

**Format:** plain CSS custom properties on `:root`, with a `[data-theme="light"]` override block. The active theme is set on `<html data-theme="dark">` (default) — the only currently-shipping theme.

**No transformation pipeline** — there is no Style Dictionary, no Tailwind config, no CSS-in-JS. Tokens are written by hand and consumed via `var(--*)` in `style.css` and component-scoped rules.

### Color palette

```css
/* Deep ink (surfaces, dark by default) */
--ink-900: #0a0a0c;   /* page background */
--ink-850: #101013;   /* deep card */
--ink-800: #15151a;   /* card */
--ink-750: #1c1c22;   /* elevated card */
--ink-700: #24242c;   /* hover surface */
--ink-600: #2e2e38;   /* divider strong */
--ink-500: #3a3a46;   /* divider */
--ink-400: #5a5a68;   /* muted icon */

/* Bone (text, warm-tinted whites) */
--bone-100: #f4efe6;  /* primary text */
--bone-200: #e6e0d4;  /* slightly dimmed */
--bone-300: #c9c2b4;  /* secondary text */
--bone-400: #8a857a;  /* tertiary / metadata */
--bone-500: #5e5a52;  /* deep metadata */

/* Single warm accent — projector amber, oklch */
--amber-300: oklch(0.86 0.12 70);
--amber-400: oklch(0.78 0.15 65);
--amber-500: oklch(0.72 0.17 60);  /* primary accent */
--amber-600: oklch(0.62 0.16 55);
--amber-700: oklch(0.52 0.14 50);

/* Functional */
--rating-star: var(--amber-400);
--positive: oklch(0.72 0.13 145);
--warning:  oklch(0.78 0.14 80);
--danger:   oklch(0.65 0.20 25);
```

**Rules for porting Figma colors:**
- Map Figma color styles to these tokens by **role** (text, surface, divider, accent), not by hex match. If a Figma frame uses an off-palette color, ask first — don't introduce new color tokens unprompted.
- Never hardcode hex values inside `style.css` rules. Hex literals are tokens-only.
- Amber is **the single accent**. Per the design context, it's used for ≤10% of pixels per screen, always tied to attention or status (active tab, match score, focus ring, "watched" pin). If a Figma layer uses a second accent, flag it.
- For any `color-mix()` blends, use `in oklch` (matches the amber palette's color space).

### Typography

```css
--font-display: "Instrument Serif", "Times New Roman", serif;
--font-body:    "Inter", -apple-system, system-ui, sans-serif;
--font-mono:    "JetBrains Mono", "SF Mono", ui-monospace, monospace;

/* Type scale */
--t-mega:    clamp(56px, 7vw, 96px);
--t-display: clamp(40px, 4.5vw, 64px);
--t-h1: 36px;
--t-h2: 28px;
--t-h3: 22px;
--t-h4: 18px;
--t-body:  15px;
--t-small: 13px;
--t-mono:  12px;
--t-tiny:  11px;
```

**Three voices, with discipline** (see `.impeccable.md` design principle 3):
- **Instrument Serif italic** — display moments only: hero titles, "Tonight's pick", section headlines. Always italic, weight 400.
- **Inter** — body copy and UI controls (buttons, form labels, paragraphs).
- **JetBrains Mono** — catalogue metadata: years, runtimes, percentages, eyebrows, the `.mono` and `.eyebrow` utility classes. Often uppercase with `letter-spacing: 0.05–0.14em`.

Never mix the roles. If a Figma frame sets a metadata row in Inter, port it as JetBrains Mono.

Fonts load from Google Fonts in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### Spacing (4px scale)

```css
--s-1: 4px;   --s-2: 8px;    --s-3: 12px;
--s-4: 16px;  --s-5: 20px;   --s-6: 24px;
--s-7: 32px;  --s-8: 40px;   --s-9: 56px;
--s-10: 72px; --s-11: 96px;
```

Use semantic tokens only. If Figma uses 13px or 18px, snap to the nearest token (`--s-3` or `--s-4`).

### Radii, borders, shadows, motion

```css
--r-1: 2px; --r-2: 4px; --r-3: 8px; --r-4: 12px; --r-pill: 999px;

--hairline:      1px solid var(--ink-600);
--hairline-soft: 1px solid var(--ink-700);

--shadow-poster: 0 20px 50px -20px rgba(0,0,0,0.8), 0 8px 20px -10px rgba(0,0,0,0.6);
--shadow-card:   0 4px 12px -4px rgba(0,0,0,0.5);

--ease-out:      cubic-bezier(0.22, 0.61, 0.36, 1);
--ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1);
--dur-fast: 140ms; --dur: 220ms; --dur-slow: 420ms;
```

---

## 2. Component Library

**Where:** rendered as plain HTML strings from `modules/ui.js` (primitives) and `modules/screens.js` (full screens). No JSX, no React, no Web Components.

**Architecture:** function-per-primitive returning an HTML string. Consumers use template-literal interpolation.

```js
// modules/ui.js
export function poster({ title, year, big = false, ratio = '2 / 3', extraClass = '', posterPath = null }) {
  // ...returns an HTML string
}
export function header({ eyebrow, title, right = '' }) { /* ... */ }
export function mobileShell({ content, footerActive, hideFooter }) { /* ... */ }
```

```js
// modules/screens.js
import { poster, header, mobileShell, sectionHead, matchBadge, esc } from './ui.js';
export function feedScreen() {
  return mobileShell({ content: `${header(...)}${tonightsPick}${grid}`, footerActive: 'feed' });
}
```

**Primitives currently exported from `modules/ui.js`:** `esc`, `stars`, `poster`, `matchBadge`, `reasonChip`, `header`, `sectionHead`, `mobileShell`, `fixtureNote`, plus the `NAV` array and `DESKTOP_QUERY` matchMedia.

**No Storybook**, no component docs site. The visual ground truth is the prototype in `docs/reference/cinematch/project/` (React) — port from Figma against this directory's existing components first.

### Naming convention (BEM-ish, `m-` prefix)

All component classes start with `m-` (for "mixtape" — historical). The pattern is `m-block__element--modifier`:

```
.m-shell, .m-header, .m-poster, .m-card, .m-tabbar
.m-poster__title, .m-card__poster-wrap, .m-tabbar__btn
.m-poster--big, .m-poster--real, .m-btn--primary, .m-btn--ghost
```

**State suffixes (not modifiers):**
- `is-active`, `is-filled`, `has-player` — applied as separate classes alongside the base class.

**When mapping a Figma component to code:**
1. Search `style.css` for an existing `m-*` class that matches the role (e.g. a Figma card → `.m-card`, a Figma hero → `.m-tonight`).
2. Reuse the class. Only add a new modifier (`--<name>`) if the variant is genuinely new.
3. Do **not** invent a new top-level block when an existing one would fit with a modifier.

---

## 3. Frameworks & Libraries

**None.** This is a zero-dependency vanilla JS project.

- **No framework** — vanilla ES modules (`<script type="module">`).
- **No bundler** — files served as-is from Vercel.
- **No CSS preprocessor** — plain CSS with custom properties.
- **No CSS-in-JS, no Tailwind, no CSS Modules.**
- **No test runner.**

**Build:** `vercel dev` for local, push to `main` for prod.
**Syntax-check:** `node --check path/to/file.js` before committing.

When porting from Figma, do **not** introduce React, Tailwind, lodash, axios, etc. If a Figma frame requires a behavior that seems to need a library, ask first.

---

## 4. Asset Management

**Movie posters** — pulled live from TMDB:

```js
// modules/ui.js → poster()
const url = `https://image.tmdb.org/t/p/${size}${posterPath}`;
// size: w92 / w154 / w185 / w342 / w500 / w780 / original
// w342 for grid cards, w500 for hero, w780 for detail
```

The service worker (`service-worker.js`) caches `image.tmdb.org` responses so the app keeps working offline against already-loaded posters. API traffic is allowed through.

**Placeholder posters** — striped pattern from `tokens.css`:

```css
.placeholder-poster {
  background-image: repeating-linear-gradient(45deg,
    var(--ink-700) 0, var(--ink-700) 8px,
    var(--ink-750) 8px, var(--ink-750) 16px);
}
```

`.m-poster` (no `.m-poster--real`) renders the same pattern with the title overlaid as fallback when no `posterPath` is available.

**No CDN config**, no asset pipeline, no image optimization step beyond TMDB's own size variants.

**Local images:** none in production. Anything user-supplied (Letterboxd CSV) lives in `localStorage`, not the filesystem.

---

## 5. Icon System

**No icon library, no icon font, no SVG sprite.**

- **PWA icon:** single SVG at `icons/icon.svg`, referenced from `manifest.webmanifest`.
- **In-app glyphs:** Unicode characters rendered as text. They live inline in templates and the `NAV` array in `modules/ui.js`:

```js
const NAV = [
  { id: 'feed',     label: 'Picks', icon: '▶' },
  { id: 'upcoming', label: 'Soon',  icon: '◷' },
  { id: 'taste',    label: 'Taste', icon: '◉' },
  { id: 'diary',    label: 'Diary', icon: '❍' },
  { id: 'more',     label: 'More',  icon: '⋯' },
];
```

Other glyphs in active use: `▸` (eyebrow tick), `↗` (external link), `↻` (refresh), `←` (back), `★` `½` `·` (star ratings), `+` (add), `●` (status pin).

**When porting Figma icons:**
1. If the icon role exists in this codebase, reuse the same Unicode character (e.g. external link = `↗`, refresh = `↻`).
2. If a Figma design uses a custom-drawn icon that has no Unicode equivalent, render it as inline SVG inside the template string. Do **not** add a new dependency.
3. Match the brand: the existing glyphs are spare typographic marks, not bold filled icons. A Figma icon that's a 24×24 filled-Material-style glyph should be reinterpreted as a thin stroke or a Unicode mark — see `.impeccable.md` ("not Netflix-y, not promotional").

---

## 6. Styling Approach

### Methodology

- **Plain CSS** with BEM-ish class names (`m-block__element--modifier`).
- **All tokens from `tokens.css`.** Hex literals appear only inside that file (and the React reference in `docs/reference/`).
- **Global styles:** `tokens.css` (variables + minimal resets) + `style.css` (every component + layout rule).
- **No CSS Modules, no scoped styles** — everything is global. Class-name discipline is what prevents collisions.

### Responsive

Mobile-first. Single primary breakpoint:

```css
/* Mobile: default rules */

@media (min-width: 481px) { /* small tweaks */ }

@media (min-width: 1024px) {
  /* Desktop: sidebar + editorial column. Drops the phone-shaped frame,
     swaps tabbar → sidebar, adds lateral padding, scales type up. */
}
```

The mobile frame is a 480px-wide centered column. Desktop becomes a 240px sidebar + a max-1440px-wide content column (`docs/reference/cinematch/` for context).

### Theme

Set via `data-theme` attribute on `<html>`. Dark is the default; light tokens exist in `tokens.css` but the app currently ships dark-only.

```html
<html lang="en" data-theme="dark">
```

If porting a Figma "light theme" frame, wire it through `[data-theme="light"]` overrides only — never duplicate component rules.

### Utilities

A small set lives at the top of `tokens.css`:

```css
.mono   { font-family: var(--font-mono); font-feature-settings: "ss01"; }
.serif  { font-family: var(--font-display); font-style: italic; font-weight: 400; }
.eyebrow {
  font-family: var(--font-mono); font-size: var(--t-tiny);
  text-transform: uppercase; letter-spacing: 0.14em; color: var(--bone-400);
}
.divider { height: 1px; background: var(--ink-600); border: 0; }
.placeholder-poster { /* striped poster fallback */ }
```

A handful of margin/typography helpers also live in `style.css` (e.g. `.m-mt-md`, `.m-min-w-0`). Prefer these to inline `style="..."` attributes when porting Figma layouts.

### Banned patterns (per `.impeccable.md` and `style.css` lineage)

- Side-stripe `border-left: Npx solid <color>` on cards/callouts. Never.
- Gradient text (`background-clip: text` over a gradient). Never.
- Gray text on colored backgrounds. Tint instead.
- Pure black (`#000`) or pure white (`#fff`). Use `--ink-900` / `--bone-100`.
- New color tokens without explicit user approval.

---

## 7. Project Structure

```
CineMatch/
├── index.html              # Loads tokens.css → style.css → app.js (ES module)
├── app.js                  # Entry: routing, render(), event delegation
├── tokens.css              # Design tokens (variables) + minimal resets/utilities
├── style.css               # Every component + layout rule (single file)
├── manifest.webmanifest    # PWA manifest (dark theme color, portrait)
├── service-worker.js       # App-shell + TMDB poster cache, API passthrough
├── icons/icon.svg          # PWA icon (only image asset in repo)
├── modules/
│   ├── ui.js               # Render primitives (poster, header, mobileShell, …)
│   ├── screens.js          # Full screen renderers (feedScreen, detailScreen, …)
│   ├── data.js             # Fixture data + constants
│   ├── storage.js          # localStorage schema + getters/setters
│   ├── letterboxd.js       # RSS + CSV ingestion + history merging
│   ├── tmdb.js             # TMDB API client (search, details, recs, upcoming, videos)
│   ├── resolver.js         # Background job: history → TMDB ids
│   ├── recommendations.js  # Recommendations engine
│   ├── upcoming.js         # Upcoming-releases builder
│   ├── taste.js            # Taste profile scoring
│   ├── sync.js             # Manual sync / CSV re-import / export / reset
│   └── notify.js           # Toast notifications
├── api/
│   └── rss-proxy.js        # Vercel serverless: Letterboxd RSS proxy
├── docs/
│   ├── figma-design-system.md   # ← this file
│   └── reference/cinematch/     # React prototype + design history (read-only)
├── CLAUDE.md               # Functional architecture + non-negotiables
├── .impeccable.md          # Design Context: users, voice, principles
└── ROADMAP.md              # Shipped/planned phases
```

### Render flow

1. `app.js` reads `window.location.hash`, dispatches to a screen function in `modules/screens.js`.
2. Screen function returns an HTML string built from `modules/ui.js` primitives.
3. `app.js` swaps `document.getElementById('root').innerHTML` with the result.
4. Click handlers are wired by **delegation** on `root` — each interactive element carries a `data-action="…"` attribute, the central listener in `app.js` routes it.

Re-renders are **idempotent** — they capture and restore `.m-scroll`'s `scrollTop` when the route key is unchanged so background data updates don't yank the user back to top.

### When porting a Figma frame

1. Identify the screen it maps to (Feed / Detail / Diary / Taste / Upcoming / More / Setup) — or whether it's a primitive (poster, card, header).
2. Find the existing renderer in `modules/screens.js` or primitive in `modules/ui.js`.
3. Reuse `tokens.css` variables for every color, type size, spacing, radius, shadow, and easing in the Figma frame.
4. Reuse existing `m-*` classes; add modifiers for new variants.
5. Wire interactions via `data-action="…"` and add the case to the `switch` in `app.js`.
6. If the Figma frame requires a new top-level block, name it `m-<feature>` and place its rules in the corresponding section of `style.css` (sections are commented `/* === Header === */`, `/* === Posters === */`, etc.).
7. `node --check` the touched modules before reporting done.
