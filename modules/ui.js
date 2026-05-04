// CineMatch UI primitives — pure render functions returning HTML strings.
// Mirrors the prototype's m-primitives.jsx but stripped of React.
// Consumers use these via template-literal interpolation in modules/screens.js.

// Escape user-provided strings to prevent HTML injection.
// Fixture data is trusted, but we run everything through esc() so that swapping
// in real Letterboxd/TMDB titles in Phase 1+ doesn't introduce a new attack surface.
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);

// Hash a string into a 0..1 fraction — used to give each placeholder poster
// a slight hue shift so they don't all look identical.
function hashFraction(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return h / 0xffff;
}

// === Star rating (mono character set) =================================
export function stars({ value, size = 11 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const chars = '★'.repeat(full) + (half ? '½' : '') + '·'.repeat(empty);
  return `<span class="stars" style="font-size:${size}px;color:var(--amber-400);letter-spacing:0.05em;">${chars}</span>`;
}

// === Striped placeholder poster =======================================
// Real TMDB poster URLs replace this in Phase 2+.
export function poster({ title, year, big = false, ratio = '2 / 3', extraClass = '' }) {
  const hue = Math.round((hashFraction(title) - 0.5) * 60); // -30..30 deg
  const ratioClass = ratio === '3 / 4' ? 'm-poster--ratio-3-4' : '';
  return `
    <div class="m-poster ${big ? 'm-poster--big' : ''} ${ratioClass} ${extraClass}"
         style="filter:hue-rotate(${hue}deg);">
      <div class="m-poster__overlay">
        <div class="m-poster__title">${esc(title)}</div>
        ${big && year ? `<div class="m-poster__year">${esc(year)}</div>` : ''}
      </div>
      <div class="m-poster__stamp">POSTER</div>
    </div>
  `;
}

// === Match score chip =================================================
export function matchBadge(score) {
  return `<span class="m-match">${Math.round(score * 100)}%</span>`;
}

// === Reason chip ======================================================
export function reasonChip({ reason, basis }) {
  const labels = { director: 'Dir', genre: 'Gen', similar: 'Sim' };
  return `
    <span class="m-reason">
      <span class="m-reason__dot">·</span>
      <span class="m-reason__label">${esc(labels[reason] || reason)}</span>
      <span class="m-reason__basis">${esc(basis)}</span>
    </span>
  `;
}

// === Page header (status-bar offset, eyebrow + title + optional right) ==
export function header({ eyebrow, title, right = '' }) {
  return `
    <header class="m-header">
      <div class="m-header__title-block">
        ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
        <h1 class="m-header__title">${esc(title)}</h1>
      </div>
      ${right}
    </header>
  `;
}

// === Bottom tab bar ===================================================
const TABS = [
  { id: 'feed',     label: 'Picks', icon: '▶' },
  { id: 'upcoming', label: 'Soon',  icon: '◷' },
  { id: 'taste',    label: 'Taste', icon: '◉' },
  { id: 'diary',    label: 'Diary', icon: '❍' },
  { id: 'more',     label: 'More',  icon: '⋯' },
];
export function tabBar(active) {
  return `
    <nav class="m-tabbar" role="navigation" aria-label="Primary">
      ${TABS.map((t) => `
        <button class="m-tabbar__btn"
                data-action="tab"
                data-tab="${t.id}"
                aria-current="${active === t.id ? 'true' : 'false'}">
          <span class="m-tabbar__icon">${t.icon}</span>
          <span>${t.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

// === Mobile shell wrapper =============================================
// Composes a scroll region + (optional) bottom tab bar.
// `content` is an HTML string for everything inside the scroll region.
export function mobileShell({ content, footerActive = 'feed', hideFooter = false }) {
  return `
    <div class="m-shell ${hideFooter ? 'no-footer' : ''}">
      <div class="m-scroll">${content}</div>
      ${hideFooter ? '' : tabBar(footerActive)}
    </div>
  `;
}

// === Section header (within a scroll region, not page-level) ==========
export function sectionHead({ title, meta = '' }) {
  return `
    <section class="m-section-head">
      <div class="m-section-head__inner">
        <h2 class="m-section-head__title">${esc(title)}</h2>
        ${meta ? `<span class="m-section-head__meta">${esc(meta)}</span>` : ''}
      </div>
    </section>
  `;
}

// === Fixture-data banner ==============================================
// Used on screens that still render placeholder data (Recommendations,
// Tonight's pick, Coming Soon, Taste profile) until TMDB resolution
// (Phase 2) and the recommendation engine (Phase 4) are built.
export function fixtureNote(message) {
  return `
    <div class="m-fixture-note" role="note">
      <strong>Preview ·</strong> ${esc(message)}
    </div>
  `;
}
