# CineMatch Design System

_Started 2026-05-04 15:04 UTC_

---

## User

CineMatch is a personal movie recommendation web app. It reads the user's Letterboxd diary via RSS feed + a one-time CSV export, crosses that history with TMDB to understand taste, and surfaces personalized recommendations (similar films + upcoming releases filtered by genre/director affinity). Let's create a design system and a visual style for this app.

## Assistant

I'll help you design CineMatch! Before I start building, let me read the CLAUDE.md you've attached and ask some focused questions about the design direction.

_[tool: read_file]_

I've got a clear picture of CineMatch. Before I start designing, I want to ask some focused questions to make sure I build something you'll love. CineMatch is a personal app for you specifically, so taste matters a lot here.

_[tool: questions_v2]_

## User

Questions timed out; go with defaults

## Assistant

I'll go with strong defaults: **Letterboxd-adjacent / neo-noir hybrid** — dark, editorial, poster-forward, with a single warm accent. Tech stack matches the project (vanilla JS, no framework), but for the design prototype I'll use React for speed.

Let me lay out a plan and start building.

_[tool: update_todos]_

_[tool: copy_starter_component]_

Now let me lay down the design system and prototype. I'll structure this as one main HTML file + JSX modules.

**Design choices** I'm committing to:
- **Aesthetic**: Editorial neo-noir. Deep ink black background (#0B0B0D), warm bone foreground, single amber accent (oklch warm-orange). Poster-forward — TMDB posters carry the visual weight.
- **Type**: "Fraktion Mono" alt → using **JetBrains Mono** for metadata/labels (cinephile catalog feel), **Instrument Serif** for editorial headlines, **Inter** for body. Three families, used with discipline.
- **Layout**: Mixed — featured "tonight's pick" hero + dense grid below. Editorial with breathing room.
- **Personality**: Warm cinephile copy, not witty/opinionated. The app observes your habits.

Let me write the shell, tokens, and components:

_[tool: write_file]_

_[tool: write_file]_

Now the shared UI primitives — poster, card, rating, sidebar:

_[tool: write_file]_

_[tool: snip]_

Now the views — feed (hero + grid), detail, taste, upcoming, setup, diary:

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

## Assistant

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

**CineMatch is live.**

**Design system delivered**
- **Aesthetic**: editorial neo-noir — deep ink (#0a0a0c) + bone (#f4efe6) + projector amber accent
- **Type**: Instrument Serif italic for editorial display, Inter for body, JetBrains Mono for catalog metadata
- **Tokens**: full palette + 4px-based spacing scale + radii + motion easings in `tokens.css`
- **Primitives**: poster placeholders (striped, no fake imagery), score badges, reason chips, star rating, sidebar nav

**Screens**
- **Recommendations feed** — "Tonight's pick" hero with the why-recommended panel + filterable grid
- **Film detail modal** — score breakdown bars + "shared DNA" connection diagram tying the recommendation to your high-rated anchor films
- **Taste profile** — top-line stats, weighted genre bars, ranked directors, decade histogram, language stack
- **Coming Soon** — calendar-day list with countdown + reason
- **Recent diary** — RSS sync feed
- **Settings** — connections, cache, danger zone
- **First-time setup** — 4-step modal (Letterboxd → TMDB → CSV → Resolving)

**Tweaks panel** lets you flip theme (dark/light), accent (amber / crimson / jade / electric), density (sparse / grid / list), and re-trigger the setup flow.

**Caveats**
- Posters are intentional striped placeholders with monospace labels — drop in TMDB poster URLs in `primitives.jsx → PosterPlaceholder` when wiring real data.
- Light theme is sketched in tokens but I biased everything for dark; light may need a polish pass.
- The prototype uses React for speed; your actual stack is vanilla JS, so when porting, the components translate cleanly to template-literal renders since there's no real local state outside the modal/setup flows.

## User

Verifier agent check completed

## Assistant

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

Fixed: hero now collapses to single column below 1100px, metadata row wraps, and `overflow-x: hidden` + `min-width: 0` on `main` prevent any sidebar-induced overflow.

## User

I like this design, but let's think it as a mobile first web app

## Assistant

_[tool: snip]_

Great pivot — let me reframe CineMatch as a mobile-first web app. I'll wrap the design in an iOS frame for the mockup but the layout itself will be true mobile-first (viewport-driven, thumb-friendly, no sidebar).

_[tool: copy_starter_component]_

_[tool: copy_starter_component]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: grep]_

_[tool: grep]_

I'll build mobile-first screens and showcase them in a design canvas with iOS frames.

_[tool: read_file]_

_[tool: snip]_

I'll keep the existing desktop file intact and create a new mobile-first version. Let me build the mobile screens.

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

Now the app shell composing all mobile screens into a design canvas:

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: snip]_

_[tool: done]_

<details>
<summary></summary>
</details>

_[tool: snip]_

_[tool: fork_verifier_agent]_

**CineMatch Mobile is live.**

I rebuilt CineMatch as mobile-first while keeping the editorial neo-noir DNA from the desktop version. The original `CineMatch.html` is preserved.

**Eight screens on a design canvas** (tap any to focus, drag to reorder):

*Primary flow* — Feed (Tonight's pick + horizontal rails + 2-col grid), Film detail (full-bleed poster hero, score breakdown, anchor films), Coming Soon (calendar-day list with countdown).

*Taste & history* — Taste profile (stat grid, weighted genre bars, decade histogram, language stack), Recent diary (RSS-live feed).

*Onboarding* — 3-step setup (Letterboxd → TMDB → CSV), full-screen mobile pattern with linear progress.

**Mobile-specific changes from the desktop**
- Sidebar → bottom tab bar with 5 tabs (Picks, Soon, Taste, Diary, More)
- Hero metadata wraps freely; all flex rows allow wrap
- Detail screen is full-bleed with poster gradient, floating glass-blur back/like/share buttons
- Horizontal-scroll rails for browsing variety without overwhelming the grid
- Touch targets ≥36px, type sized for thumb-distance reading
- Status-bar offset (60px top) on every header so nothing collides with the iOS notch

**Tweaks panel**
- **Mode**: Canvas (all screens at once) ↔ Live phone (single screen, full viewport — closer to a real prototype)
- **Live screen**: pick which screen fills the viewport in live mode
- **Accent**: amber / crimson / jade / electric

