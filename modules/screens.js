// CineMatch screen renderers — return HTML strings for each screen.
// Mirrors the prototype's m-screens-1.jsx + m-screens-2.jsx, ported to vanilla.
// All event hooks are data-attribute based; app.js handles them via delegation.

import { CINEMATCH_DATA, TODAY } from './data.js';
import { esc, poster, matchBadge, header, mobileShell, sectionHead, stars, fixtureNote } from './ui.js';
import { storage } from './storage.js';

// =====================================================================
// FEED — Tonight's pick + horizontal rails + 2-col grid
// =====================================================================
export function feedScreen() {
  const data = CINEMATCH_DATA;
  const refreshButton = `<button class="m-header__action" data-action="refresh" aria-label="Refresh">↻</button>`;

  const tonightsPick = `
    <button class="m-tonight"
            data-action="open-film"
            data-film-id="${data.hero.id}"
            aria-label="Tonight's pick: ${esc(data.hero.title)}, ${esc(data.hero.year)}, directed by ${esc(data.hero.director)}">
      <div class="m-tonight__eyebrow">▸ Tonight's pick</div>
      <div class="m-tonight__hero">
        ${poster({ title: data.hero.title, year: data.hero.year, ratio: '3 / 4', big: true })}
        <div>
          <h2 class="m-tonight__title">${esc(data.hero.title)}</h2>
          <div class="m-tonight__meta">
            <span>${esc(data.hero.year)}</span>
            <span class="m-tonight__meta-sep" aria-hidden="true">/</span>
            <span>${esc(data.hero.director.toUpperCase())}</span>
            <span class="m-tonight__meta-sep" aria-hidden="true">/</span>
            <span>${esc(data.hero.runtime)} MIN</span>
          </div>
        </div>
        <div class="m-tonight__why">
          <div class="eyebrow">Why you'll love it</div>
          <p>${esc(data.hero.why)}</p>
        </div>
      </div>
    </button>
  `;

  const rail1 = rail({
    title: 'Because of Céline Sciamma',
    films: data.recommendations.slice(0, 4),
  });
  const rail2 = rail({
    title: 'Slow-cinema kick',
    films: data.recommendations.slice(3, 8),
  });

  const grid = `
    <section class="m-grid-section">
      <div class="eyebrow eyebrow--mb-md">The full list</div>
      <div class="m-grid">
        ${data.recommendations.map(gridCard).join('')}
      </div>
    </section>
  `;

  const content = `
    ${header({ eyebrow: '04 May · 12 new picks', title: 'CineMatch', right: refreshButton })}
    ${fixtureNote('Recommendations are placeholder data until Phase 4 ships the engine.')}
    ${tonightsPick}
    ${sectionHead({ title: 'More for you', meta: '12 FILMS' })}
    ${rail1}
    ${rail2}
    ${grid}
  `;

  return mobileShell({ content, footerActive: 'feed' });
}

function rail({ title, films }) {
  return `
    <section class="m-rail">
      <div class="m-rail__head">
        <h3 class="m-rail__title">${esc(title)}</h3>
        <span class="m-rail__more" aria-hidden="true">→</span>
      </div>
      <div class="m-rail__track">
        ${films.map((film) => `
          <button class="m-rail__item"
                  data-action="open-film"
                  data-film-id="${film.id}"
                  aria-label="${esc(film.title)}, ${esc(film.year)}, ${Math.round(film.score * 100)}% match">
            <div class="m-rail__poster-wrap">
              ${poster({ title: film.title, year: film.year })}
              <div class="m-rail__match">${matchBadge(film.score)}</div>
            </div>
            <div class="m-rail__title-text">${esc(film.title)}</div>
            <div class="m-rail__director">${esc(film.director)}</div>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function gridCard(film) {
  return `
    <button class="m-card"
            data-action="open-film"
            data-film-id="${film.id}"
            aria-label="${esc(film.title)}, ${esc(film.year)}, directed by ${esc(film.director)}, ${Math.round(film.score * 100)}% match">
      <div class="m-card__poster-wrap">
        ${poster({ title: film.title, year: film.year })}
        <div class="m-card__match">${matchBadge(film.score)}</div>
      </div>
      <div class="m-card__title">${esc(film.title)}</div>
      <div class="m-card__meta">${esc(film.director)} · ${esc(film.year)}</div>
    </button>
  `;
}

// =====================================================================
// DETAIL — full-bleed poster hero + score breakdown + connection
// =====================================================================
export function detailScreen(film) {
  if (!film) return '';
  // Defaults match the prototype so unrelated films render gracefully.
  const f = {
    tagline: 'We share the same sky.',
    runtime: 102,
    genres: ['Drama'],
    why: 'Slow, observational dramas with father-daughter intimacy — three of your five-star films share this DNA.',
    matches: ['Past Lives', 'The Souvenir', 'Petite Maman'],
    score: 0.94,
    ...film,
  };

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

  const content = `
    <div class="m-detail-hero">
      <div class="m-detail-hero__scrim"></div>
      ${heroChrome}
      <div class="m-detail-hero__caption">
        <div class="m-detail-hero__match">${Math.round(f.score * 100)}% Match · in your wheelhouse</div>
        <h1 class="m-detail-hero__title">${esc(f.title)}</h1>
      </div>
    </div>

    <div class="m-detail-body">
      <div class="m-detail__meta">
        <span>${esc(f.year)}</span>
        <span class="m-detail__meta-sep" aria-hidden="true">/</span>
        <span>${esc(f.director.toUpperCase())}</span>
        <span class="m-detail__meta-sep" aria-hidden="true">/</span>
        <span>${esc(f.runtime)} MIN</span>
        <span class="m-detail__meta-sep" aria-hidden="true">/</span>
        <span>${esc(f.genres.join(' · ').toUpperCase())}</span>
      </div>

      <p class="m-detail__tagline">&ldquo;${esc(f.tagline)}&rdquo;</p>

      <button class="m-btn m-btn--primary m-mt-md">+ Add to Letterboxd watchlist</button>
      <div class="m-detail__cta-row">
        <button class="m-btn m-btn--ghost">Trailer ↗</button>
        <button class="m-btn m-btn--ghost-soft">Not for me</button>
      </div>

      <div class="m-detail__section">
        <div class="eyebrow eyebrow--mb-lg">The connection</div>
        <p class="m-detail__why">${esc(f.why)}</p>
        <div class="m-detail__matches">${matchRows}</div>
      </div>

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
// =====================================================================
export function tasteScreen() {
  const t = CINEMATCH_DATA.taste;

  const stats = [
    { label: 'Films logged', value: '847', sub: 'since Apr 2019' },
    { label: 'This year',    value: '112', sub: '+18% YoY' },
    { label: 'Avg rating',   value: '3.4', sub: '★★★⯨' },
    { label: 'Avg runtime',  value: '118', sub: 'minutes' },
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

  const maxDecade = Math.max(...t.decades.map((x) => x.count));
  const decadeCols = t.decades.map((d) => {
    const h = (d.count / maxDecade) * 100;
    const isPeak = d.decade === '2010s';
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

  const content = `
    ${header({ eyebrow: '847 films · 2019 → present', title: 'Your taste' })}
    ${fixtureNote('Taste profile is computed in Phase 3 from your real watch history.')}
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
