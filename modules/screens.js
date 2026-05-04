// CineMatch screen renderers — return HTML strings for each screen.
// Mirrors the prototype's m-screens-1.jsx + m-screens-2.jsx, ported to vanilla.
// All event hooks are data-attribute based; app.js handles them via delegation.

import { CINEMATCH_DATA, TODAY } from './data.js';
import { esc, poster, matchBadge, header, mobileShell, sectionHead, stars, fixtureNote } from './ui.js';
import { storage } from './storage.js';

// =====================================================================
// FEED — Tonight's pick + grid, sourced from the live recommendations
// engine (Phase 4). Uses storage.getRecommendations() output.
// =====================================================================
export function feedScreen() {
  const recsBlob = storage.getRecommendations();
  const profile = storage.getTasteProfile();
  const history = storage.getHistory();

  // === Empty: setup not run / no history yet ===
  if (history.length === 0) {
    const content = `
      ${header({ eyebrow: 'No history yet', title: 'CineMatch' })}
      <div class="m-empty">
        <div class="m-empty__title">Nothing to recommend yet</div>
        <p class="m-empty__body">Complete setup so we can read your Letterboxd diary, then your recommendations build automatically once we know your taste.</p>
        <button class="m-btn m-btn--ghost" data-action="open-setup">Open setup</button>
      </div>
    `;
    return mobileShell({ content, footerActive: 'feed' });
  }

  // === Building: profile not ready, or recs not yet computed ===
  if (!profile?.ready || !recsBlob) {
    const enriched = history.filter((e) => Array.isArray(e.genres)).length;
    const total = history.length;
    const pct = total > 0 ? Math.round((enriched / total) * 100) : 0;
    const message = !profile?.ready
      ? (profile?.message || 'Resolving films against TMDB to learn your taste…')
      : 'Taste profile ready — building your recommendations…';
    const content = `
      ${header({ eyebrow: 'Tuning', title: 'CineMatch' })}
      <div class="m-empty">
        <div class="m-empty__title">Almost there</div>
        <p class="m-empty__body">${esc(message)}</p>
        <div class="m-taste__progress">
          <div class="m-taste__progress-track">
            <div class="m-taste__progress-fill" style="width:${pct}%;"></div>
          </div>
          <div class="m-taste__progress-label">${enriched} / ${total} films enriched</div>
        </div>
      </div>
    `;
    return mobileShell({ content, footerActive: 'feed' });
  }

  // === Edge: recs built but produced no items ===
  if (!recsBlob.items || recsBlob.items.length === 0) {
    const content = `
      ${header({ eyebrow: 'Nothing surfaced', title: 'CineMatch' })}
      <div class="m-empty">
        <div class="m-empty__title">${esc(recsBlob.message || 'No recommendations yet')}</div>
        <p class="m-empty__body">Rate a few more films on Letterboxd at ${'★'.repeat(4)} or ${'★'.repeat(5)} — we draw recommendations from your highest-rated recent watches.</p>
      </div>
    `;
    return mobileShell({ content, footerActive: 'feed' });
  }

  // === Live ===
  const items = recsBlob.items;
  const hero = items[0];
  const rest = items.slice(1);
  const refreshButton = `<button class="m-header__action" data-action="refresh-recs" aria-label="Rebuild recommendations">↻</button>`;
  const todayLabel = new Date().toLocaleDateString('en', { day: 'numeric', month: 'short' });
  const eyebrow = `${todayLabel} · ${items.length} picks · from ${recsBlob.sourceCount} of your favourites`;

  const heroMeta = [
    hero.year ? String(hero.year) : null,
    hero.genres?.length ? hero.genres.slice(0, 2).join(' · ').toUpperCase() : null,
    `BECAUSE ${hero.because.toUpperCase()}`,
  ].filter(Boolean);

  const tonightsPick = `
    <button class="m-tonight"
            data-action="open-rec"
            data-tmdb-id="${hero.tmdb_id}"
            aria-label="Tonight's pick: ${esc(hero.title)}${hero.year ? ', ' + hero.year : ''}, because you loved ${esc(hero.because)}">
      <div class="m-tonight__eyebrow">▸ Tonight's pick</div>
      <div class="m-tonight__hero">
        ${poster({ title: hero.title, year: hero.year, ratio: '3 / 4', big: true, posterPath: hero.poster_path })}
        <div>
          <h2 class="m-tonight__title">${esc(hero.title)}</h2>
          <div class="m-tonight__meta">
            ${heroMeta.map((m, i) => `
              ${i > 0 ? `<span class="m-tonight__meta-sep" aria-hidden="true">/</span>` : ''}
              <span>${esc(m)}</span>
            `).join('')}
          </div>
        </div>
        <div class="m-tonight__why">
          <div class="eyebrow">Why you'll love it</div>
          <p>Because <em>${esc(hero.because)}</em> was a ${'★'.repeat(Math.floor(hero.because_rating))}${hero.because_rating % 1 ? '½' : ''} watch and TMDB sees a strong overlap with your taste — ${Math.round(hero.match * 100)}% match.</p>
        </div>
      </div>
    </button>
  `;

  const grid = `
    <section class="m-grid-section">
      <div class="eyebrow eyebrow--mb-md">The full list</div>
      <div class="m-grid">
        ${rest.map(recGridCard).join('')}
      </div>
    </section>
  `;

  const content = `
    ${header({ eyebrow, title: 'CineMatch', right: refreshButton })}
    ${tonightsPick}
    ${sectionHead({ title: 'More for you', meta: `${rest.length} FILMS` })}
    ${grid}
  `;
  return mobileShell({ content, footerActive: 'feed' });
}

function recGridCard(rec) {
  const meta = [
    rec.year ? String(rec.year) : null,
    rec.genres?.length ? rec.genres[0] : null,
  ].filter(Boolean).join(' · ');
  return `
    <button class="m-card"
            data-action="open-rec"
            data-tmdb-id="${rec.tmdb_id}"
            aria-label="${esc(rec.title)}${rec.year ? ', ' + rec.year : ''}, ${Math.round(rec.match * 100)}% match, because you loved ${esc(rec.because)}">
      <div class="m-card__poster-wrap">
        ${poster({ title: rec.title, year: rec.year, posterPath: rec.poster_path })}
        <div class="m-card__match">${matchBadge(rec.match)}</div>
      </div>
      <div class="m-card__title">${esc(rec.title)}</div>
      <div class="m-card__meta">${esc(meta)}</div>
      <div class="m-card__because">because <em>${esc(rec.because)}</em></div>
    </button>
  `;
}

// =====================================================================
// DETAIL — full-bleed poster hero + score breakdown + connection
// =====================================================================
export function detailScreen(film) {
  if (!film) return '';
  // Defaults so films from any source render gracefully.
  const f = {
    tagline: '',
    runtime: null,
    director: null,
    genres: [],
    why: '',
    matches: [],
    score: 0.85,
    poster_path: null,
    overview: '',
    because: null,
    because_rating: null,
    ...film,
  };

  // For real recommendations, the "connection" copy comes from the anchor
  // film + TMDB overview; otherwise we fall back to the canned poetic line.
  if (f.because) {
    if (!f.matches?.length) f.matches = [f.because];
    if (!f.why) {
      const ratingLabel = f.because_rating
        ? `${'★'.repeat(Math.floor(f.because_rating))}${f.because_rating % 1 ? '½' : ''}`
        : '';
      f.why = f.overview
        ? f.overview
        : `Recommended because ${f.because}${ratingLabel ? ` (${ratingLabel})` : ''} sits in your wheelhouse and TMDB sees a strong overlap with your taste.`;
    }
  }

  const heroChrome = `
    <div class="m-detail-hero__chrome">
      <button class="m-glass-btn" data-action="close-film" aria-label="Back">←</button>
      <div class="m-detail-hero__chrome-right">
        <button class="m-glass-btn" aria-label="Like">♡</button>
        <button class="m-glass-btn" aria-label="Share">↗</button>
      </div>
    </div>
  `;

  const matchRows = f.matches.map((m) => `
    <div class="m-detail__match-row">
      <div class="m-detail__match-poster">${poster({ title: m })}</div>
      <div>
        <div class="m-detail__match-title">${esc(m)}</div>
        <div class="m-detail__match-source">From your diary</div>
      </div>
      <span class="m-detail__match-stars">★★★★★</span>
    </div>
  `).join('');

  const scoreBars = [
    { label: 'Genre overlap',     value: 0.91 },
    { label: 'Director affinity', value: 0.74 },
    { label: 'Decade preference', value: 0.88 },
    { label: 'Tonal match',       value: 0.82 },
    { label: 'Runtime fit',       value: 0.95 },
  ].map((s) => `
    <div>
      <div class="m-score-row__head">
        <span class="m-score-row__label">${esc(s.label)}</span>
        <span class="m-score-row__pct">${Math.round(s.value * 100)}</span>
      </div>
      <div class="m-score-row__track">
        <div class="m-score-row__fill" style="width:${s.value * 100}%;"></div>
      </div>
    </div>
  `).join('');

  // Build meta row only from fields we actually have.
  const metaParts = [
    f.year ? esc(f.year) : null,
    f.director ? esc(f.director.toUpperCase()) : null,
    f.runtime ? `${esc(f.runtime)} MIN` : null,
    f.genres?.length ? esc(f.genres.join(' · ').toUpperCase()) : null,
  ].filter(Boolean);
  const metaRow = metaParts.map((part, i) => `
    ${i > 0 ? `<span class="m-detail__meta-sep" aria-hidden="true">/</span>` : ''}
    <span>${part}</span>
  `).join('');

  // Letterboxd watchlist link — direct URI if known, search fallback otherwise
  // (per CLAUDE.md "Letterboxd Watchlist Linking" two-tier strategy).
  const lbxLink = f.letterboxd_uri
    || `https://letterboxd.com/search/films/${encodeURIComponent(`${f.title} ${f.year || ''}`)}/`;

  const heroBody = f.poster_path
    ? `<img class="m-detail-hero__img" src="https://image.tmdb.org/t/p/w780${f.poster_path}" alt="${esc(f.title)}" />`
    : '';
  const heroClass = f.poster_path ? 'm-detail-hero m-detail-hero--real' : 'm-detail-hero';

  const content = `
    <div class="${heroClass}">
      ${heroBody}
      <div class="m-detail-hero__scrim"></div>
      ${heroChrome}
      <div class="m-detail-hero__caption">
        <div class="m-detail-hero__match">${Math.round(f.score * 100)}% Match · in your wheelhouse</div>
        <h1 class="m-detail-hero__title">${esc(f.title)}</h1>
      </div>
    </div>

    <div class="m-detail-body">
      ${metaRow ? `<div class="m-detail__meta">${metaRow}</div>` : ''}

      ${f.tagline ? `<p class="m-detail__tagline">&ldquo;${esc(f.tagline)}&rdquo;</p>` : ''}

      <a class="m-btn m-btn--primary m-mt-md" href="${esc(lbxLink)}" target="_blank" rel="noopener">+ Add to Letterboxd watchlist</a>
      <div class="m-detail__cta-row">
        <button class="m-btn m-btn--ghost">Trailer ↗</button>
        <button class="m-btn m-btn--ghost-soft">Not for me</button>
      </div>

      ${f.why ? `
      <div class="m-detail__section">
        <div class="eyebrow eyebrow--mb-lg">The connection</div>
        <p class="m-detail__why">${esc(f.why)}</p>
        ${matchRows ? `<div class="m-detail__matches">${matchRows}</div>` : ''}
      </div>` : ''}

      <div class="m-detail__section">
        <div class="eyebrow eyebrow--mb-lg">Score breakdown</div>
        <div class="m-score-bars">${scoreBars}</div>
      </div>
    </div>
  `;

  return mobileShell({ content, hideFooter: true });
}

// =====================================================================
// UPCOMING — calendar-day list with countdown + reason
// =====================================================================
export function upcomingScreen() {
  const data = CINEMATCH_DATA;
  const rows = data.upcoming.map((film) => {
    const date = new Date(film.releaseDate);
    const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const days = Math.round((date - TODAY) / (1000 * 60 * 60 * 24));
    return `
      <button class="m-upcoming__row"
              data-action="open-film"
              data-film-id="${film.id}"
              aria-label="${esc(film.title)}, releases ${month} ${day}, in ${days} days">
        <div class="m-upcoming__date" aria-hidden="true">
          <div class="m-upcoming__month">${month}</div>
          <div class="m-upcoming__day">${day}</div>
          <div class="m-upcoming__countdown">IN ${days}D</div>
        </div>
        <div>${poster({ title: film.title, year: film.year })}</div>
        <div class="m-min-w-0">
          <div class="m-upcoming__title">${esc(film.title)}</div>
          <div class="m-upcoming__director">${esc(film.director.toUpperCase())}</div>
          <div class="m-upcoming__reason">→ ${esc(film.reason)}</div>
        </div>
      </button>
    `;
  }).join('');

  const content = `
    ${header({ eyebrow: 'Filtered to your taste · region AR', title: 'Coming Soon' })}
    ${fixtureNote('Upcoming releases land in Phase 5 once the taste profile drives the filter.')}
    <div class="m-upcoming-list">${rows}</div>
  `;
  return mobileShell({ content, footerActive: 'upcoming' });
}

// =====================================================================
// TASTE — stat grid, genre bars, directors, decade chart, languages
// Reads the live TasteProfile computed by modules/taste.js from the
// resolver's enriched watch_history. Shows building/empty states when
// the profile isn't ready yet.
// =====================================================================
export function tasteScreen() {
  const profile = storage.getTasteProfile();
  const history = storage.getHistory();

  // === Empty state: setup not run, or no history yet ===
  if (history.length === 0) {
    const content = `
      ${header({ eyebrow: 'No history yet', title: 'Your taste' })}
      <div class="m-empty">
        <div class="m-empty__title">No films logged</div>
        <p class="m-empty__body">Complete setup so we can read your Letterboxd diary, then your taste profile builds automatically as we resolve films against TMDB.</p>
        <button class="m-btn m-btn--ghost" data-action="open-setup">Open setup</button>
      </div>
    `;
    return mobileShell({ content, footerActive: 'taste' });
  }

  // === Building state: enrichment hasn't produced enough rated films ===
  if (!profile || !profile.ready) {
    const enriched = history.filter((e) => Array.isArray(e.genres)).length;
    const total = history.length;
    const pct = total > 0 ? Math.round((enriched / total) * 100) : 0;
    const message = profile?.message || 'Resolving films against TMDB to learn your taste…';
    const content = `
      ${header({ eyebrow: 'Building your profile', title: 'Your taste' })}
      <div class="m-empty">
        <div class="m-empty__title">Hold on a minute</div>
        <p class="m-empty__body">${esc(message)}</p>
        <div class="m-taste__progress">
          <div class="m-taste__progress-track">
            <div class="m-taste__progress-fill" style="width:${pct}%;"></div>
          </div>
          <div class="m-taste__progress-label">${enriched} / ${total} films enriched</div>
        </div>
      </div>
    `;
    return mobileShell({ content, footerActive: 'taste' });
  }

  // === Live profile ===
  const t = {
    topGenres: profile.topGenres,
    topDirectors: profile.topDirectors,
    decades: profile.decades,
    languages: profile.languages,
  };

  // Derive headline stats from the live history, not from fixture data.
  const ratedHistory = history.filter((e) => typeof e.rating === 'number' && e.rating > 0);
  const avgRating = ratedHistory.length
    ? (ratedHistory.reduce((s, e) => s + e.rating, 0) / ratedHistory.length).toFixed(1)
    : '—';
  const thisYearStart = `${new Date().getFullYear()}-01-01`;
  const thisYearCount = history.filter((e) => (e.watched_date || '') >= thisYearStart).length;

  const stats = [
    { label: 'Films logged', value: String(history.length), sub: `${profile.enrichedCount} enriched` },
    { label: 'This year',    value: String(thisYearCount),  sub: `vs all-time` },
    { label: 'Avg rating',   value: String(avgRating),      sub: `${ratedHistory.length} rated` },
    { label: 'Avg runtime',  value: String(profile.runtime.avg || '—'), sub: 'minutes' },
  ].map((s) => `
    <div class="m-taste__stat">
      <div class="eyebrow eyebrow--stat">${esc(s.label)}</div>
      <div class="m-taste__stat-value">${esc(s.value)}</div>
      <div class="m-taste__stat-sub">${esc(s.sub)}</div>
    </div>
  `).join('');

  const genres = t.topGenres.slice(0, 6).map((g, i) => `
    <div class="m-taste__genre-row ${i < 3 ? 'is-top' : ''}">
      <span class="m-taste__genre-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="m-taste__genre-name">${esc(g.name)}</span>
      <div class="m-taste__genre-bar">
        <div class="m-taste__genre-fill" style="width:${g.weight * 100}%;"></div>
      </div>
      <span class="m-taste__genre-count">${esc(g.count)}</span>
    </div>
  `).join('');

  const directors = t.topDirectors.slice(0, 5).map((d) => `
    <div class="m-taste__director-row">
      <div class="m-taste__director-name">${esc(d.name)}</div>
      <span class="m-taste__director-count">${esc(d.count)} FILMS</span>
      ${stars({ value: d.avgRating, size: 10 })}
    </div>
  `).join('');

  const maxDecade = Math.max(...t.decades.map((x) => x.count), 1);
  const decadeCols = t.decades.map((d) => {
    const h = (d.count / maxDecade) * 100;
    const isPeak = d.count === maxDecade;
    return `
      <div class="m-taste__decade ${isPeak ? 'is-peak' : ''}">
        <span class="m-taste__decade-count">${esc(d.count)}</span>
        <div class="m-taste__decade-bar" style="height:${h}%;"></div>
        <span class="m-taste__decade-label">${esc(d.decade.replace('s', ''))}</span>
      </div>
    `;
  }).join('');

  const langPalette = [
    'var(--amber-500)', 'var(--amber-600)', 'var(--amber-700)',
    'var(--ink-600)',   'var(--ink-700)',   'var(--ink-750)',
  ];
  const langStack = t.languages.map((l, i) => `
    <div class="m-taste__lang-seg" style="flex:${l.pct};background:${langPalette[i] || langPalette[langPalette.length - 1]};"></div>
  `).join('');
  const langLegend = t.languages.map((l, i) => `
    <div class="m-taste__lang-legend-item">
      <div class="m-taste__lang-swatch" style="background:${langPalette[i] || langPalette[langPalette.length - 1]};"></div>
      <span class="m-taste__lang-name">${esc(l.name)} <span class="m-taste__lang-pct">${esc(l.pct)}%</span></span>
    </div>
  `).join('');

  const eyebrow = `${profile.ratedCount} rated films · live`;
  const content = `
    ${header({ eyebrow, title: 'Your taste' })}
    <div class="m-taste-body">
      <div class="m-taste__statgrid">${stats}</div>

      <div class="m-taste__block">
        <div class="eyebrow eyebrow--mb-md">Genre affinity</div>
        ${genres}
      </div>

      <div class="m-taste__block">
        <div class="eyebrow eyebrow--mb-md">Top directors</div>
        ${directors}
      </div>

      <div class="m-taste__block">
        <div class="eyebrow eyebrow--mb-md">Decades</div>
        <div class="m-taste__decades" style="grid-template-columns:repeat(${t.decades.length}, 1fr);">
          ${decadeCols}
        </div>
      </div>

      <div class="m-taste__block">
        <div class="eyebrow eyebrow--mb-md">Languages</div>
        <div class="m-taste__lang-stack">${langStack}</div>
        <div class="m-taste__lang-legend">${langLegend}</div>
      </div>
    </div>
  `;
  return mobileShell({ content, footerActive: 'taste' });
}

// =====================================================================
// DIARY — recent watches from real localStorage history (Phase 1+ data)
// =====================================================================
export function diaryScreen() {
  const history = storage.getHistory();
  const lastSync = storage.getLastSync();
  const live = `<span class="m-header__live">● RSS</span>`;

  // Empty state for users who haven't completed setup or whose RSS fetch failed.
  if (history.length === 0) {
    const content = `
      ${header({ eyebrow: 'Nothing synced yet', title: 'Recent diary', right: live })}
      <div class="m-diary-list">
        <div class="m-empty">
          <div class="m-empty__title">No watches yet</div>
          <p class="m-empty__body">Complete setup to fetch your Letterboxd diary, or upload your CSV export for the full back catalogue.</p>
          <button class="m-btn m-btn--ghost" data-action="open-setup">Open setup</button>
        </div>
      </div>
    `;
    return mobileShell({ content, footerActive: 'diary' });
  }

  const resolved = history.filter((e) => e.tmdb_id && e.tmdb_id > 0).length;
  const unresolved = history.length - resolved;
  const baseLabel = lastSync
    ? `Synced ${diaryRelativeTime(Date.now() - lastSync)} ago · ${history.length} films`
    : `${history.length} films`;
  const eyebrow = unresolved > 0
    ? `${baseLabel} · resolving ${unresolved} via TMDB…`
    : baseLabel;

  // Diary view shows the most-recent 50 watches; full history is searchable later.
  const rows = history.slice(0, 50).map((entry) => {
    const date = entry.watched_date ? new Date(entry.watched_date) : null;
    const dateStr = date && !isNaN(date)
      ? date.toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase()
      : '—';
    const ratingHtml = entry.rating != null
      ? stars({ value: entry.rating, size: 11 })
      : `<span class="m-diary__unrated">unrated</span>`;
    return `
      <div class="m-diary__row">
        <div class="m-diary__poster">${poster({ title: entry.title, year: entry.year, posterPath: entry.poster_path })}</div>
        <div class="m-min-w-0">
          <div class="m-diary__title">${esc(entry.title)}</div>
          <div class="m-diary__meta">${entry.year ? esc(entry.year) + ' · ' : ''}${esc(dateStr)}${entry.rewatch ? ' · ↻' : ''}</div>
        </div>
        ${ratingHtml}
      </div>
    `;
  }).join('');

  const content = `
    ${header({ eyebrow, title: 'Recent diary', right: live })}
    <div class="m-diary-list">${rows}</div>
  `;
  return mobileShell({ content, footerActive: 'diary' });
}

// Local copy of the relative-time helper so the diary can show its sync age.
function diaryRelativeTime(ms) {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.round(hr / 24)}d`;
}

// =====================================================================
// MORE / SETTINGS — connections + data status
// =====================================================================
export function moreScreen() {
  const username = storage.getUsername();
  const token = storage.getToken();
  const history = storage.getHistory();
  const lastSync = storage.getLastSync();

  const tokenMask = token ? `•••• ${token.slice(-4)}` : 'Not set';
  const historyLabel = history.length ? `${history.length} films` : 'Not loaded';
  const syncLabel = lastSync
    ? relativeTime(Date.now() - lastSync) + ' ago'
    : 'Never';

  const rows = [
    ['Letterboxd',    username ? `@${username}` : 'Not set'],
    ['TMDB token',    tokenMask],
    ['Watch history', historyLabel],
    ['Last sync',     syncLabel],
    ['Region',        'Argentina'],
    ['Cache',         'Phase 2+'],
    ['Taste profile', 'Phase 3+'],
  ].map(([label, value]) => `
    <div class="m-settings__row">
      <div>
        <div class="m-settings__row-label">${esc(label)}</div>
        <div class="m-settings__row-value">${esc(value)}</div>
      </div>
      <span class="m-settings__chevron">›</span>
    </div>
  `).join('');

  const content = `
    ${header({ eyebrow: 'Connections + data', title: 'More' })}
    <div class="m-settings">
      ${rows}
      <button class="m-btn m-btn--ghost m-settings__rerun" data-action="open-setup">Re-run setup</button>
    </div>
  `;
  return mobileShell({ content, footerActive: 'more' });
}

// Compact relative-time label for the More screen ("12m", "3h", "2d").
function relativeTime(ms) {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.round(hr / 24)}d`;
}

// =====================================================================
// SETUP — 3-step onboarding wizard
// =====================================================================
export function setupScreen(step = 1) {
  const total = 3;
  const steps = [
    { n: '01', label: 'Letterboxd' },
    { n: '02', label: 'TMDB' },
    { n: '03', label: 'History' },
  ];
  const current = steps[step - 1];

  const progress = steps.map((_, i) => `
    <div class="m-setup__progress-step ${i + 1 <= step ? 'is-active' : ''}"></div>
  `).join('');

  // Pre-fill from any previously-saved values so users can resume mid-setup.
  const savedUsername = esc(storage.getUsername() || '');

  let body = '';
  let continueAttrs = '';

  if (step === 1) {
    body = `
      <h1 class="m-setup__title">Who are you<br/>on Letterboxd?</h1>
      <p class="m-setup__lede">We'll fetch your last ~50 watches from your public RSS feed.</p>
      <label class="m-setup__field" for="setup-username">
        <span class="m-setup__field-prefix">letterboxd.com/</span>
        <input type="text"
               id="setup-username"
               class="m-setup__field-input"
               autocomplete="off"
               autocapitalize="off"
               autocorrect="off"
               spellcheck="false"
               placeholder="your-username"
               value="${savedUsername}" />
      </label>
      <div class="m-setup__error" id="setup-error" hidden></div>
    `;
    continueAttrs = `data-action="setup-1-continue"`;
  } else if (step === 2) {
    body = `
      <h1 class="m-setup__title">Paste your<br/>TMDB token</h1>
      <p class="m-setup__lede">Free + non-commercial. Stored in localStorage only — never on a server. <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener" style="color: var(--amber-400);">Get one →</a></p>
      <label class="visually-hidden" for="setup-tmdb-token">TMDB read access token</label>
      <textarea id="setup-tmdb-token"
                class="m-setup__token"
                rows="4"
                spellcheck="false"
                autocapitalize="off"
                autocomplete="off"
                placeholder="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI…"></textarea>
      <div class="m-setup__error" id="setup-error" hidden></div>
    `;
    continueAttrs = `data-action="setup-2-continue"`;
  } else {
    body = `
      <h1 class="m-setup__title">Drop your<br/>CSV export</h1>
      <p class="m-setup__lede">Optional but recommended. Gives us your full history, not just the recent 50. Export from <a href="https://letterboxd.com/data/" target="_blank" rel="noopener" style="color: var(--amber-400);">letterboxd.com/data/</a></p>
      <label class="m-setup__drop" for="setup-csv-input" id="setup-csv-label">
        <div class="m-setup__drop-prompt">Tap to choose CSV</div>
        <div class="m-setup__drop-sub">stays on your device</div>
        <input type="file"
               id="setup-csv-input"
               class="m-setup__drop-input"
               accept=".csv,text/csv"
               data-action="csv-pick" />
      </label>
      <div class="m-setup__error" id="setup-error" hidden></div>
    `;
    continueAttrs = `data-action="setup-3-continue"`;
  }

  const content = `
    <div class="m-setup">
      <div class="m-setup__progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${step}" aria-label="Setup progress">
        ${progress}
      </div>
      <div class="eyebrow eyebrow--mb-sm">Step ${current.n} · ${current.label}</div>
      ${body}
      <div class="m-setup__footer">
        <button class="m-btn m-btn--bone" ${continueAttrs} id="setup-continue">Continue →</button>
        ${step === 3 ? `<button class="m-btn m-btn--text" data-action="setup-3-skip">Skip for now</button>` : ''}
      </div>
    </div>
  `;
  return mobileShell({ content, hideFooter: true });
}
