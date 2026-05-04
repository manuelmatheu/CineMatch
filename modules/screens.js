// CineMatch screen renderers — return HTML strings for each screen.
// Mirrors the prototype's m-screens-1.jsx + m-screens-2.jsx, ported to vanilla.
// All event hooks are data-attribute based; app.js handles them via delegation.

import { CINEMATCH_DATA, TODAY } from './data.js';
import { esc, poster, matchBadge, header, mobileShell, sectionHead, stars } from './ui.js';

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
// DIARY — recent watches list (RSS live)
// =====================================================================
export function diaryScreen() {
  const data = CINEMATCH_DATA;
  const live = `<span class="m-header__live">● RSS</span>`;

  const rows = data.recentDiary.map((entry) => {
    const dateStr = new Date(entry.date)
      .toLocaleDateString('en', { month: 'short', day: 'numeric' })
      .toUpperCase();
    return `
      <div class="m-diary__row">
        <div class="m-diary__poster">${poster({ title: entry.title, year: entry.year })}</div>
        <div class="m-min-w-0">
          <div class="m-diary__title">${esc(entry.title)}</div>
          <div class="m-diary__meta">${esc(entry.year)} · ${esc(dateStr)}</div>
        </div>
        ${stars({ value: entry.rating, size: 11 })}
      </div>
    `;
  }).join('');

  const content = `
    ${header({ eyebrow: 'Live · synced 12m ago', title: 'Recent diary', right: live })}
    <div class="m-diary-list">${rows}</div>
  `;
  return mobileShell({ content, footerActive: 'diary' });
}

// =====================================================================
// MORE / SETTINGS — connections + data status
// =====================================================================
export function moreScreen() {
  const rows = [
    ['Letterboxd',    '@manuelmatheu'],
    ['TMDB token',    '•••• Mxng'],
    ['CSV history',   '847 films'],
    ['Region',        'Argentina'],
    ['Cache',         '412 films · 24h TTL'],
    ['Taste profile', 'Recomputed 12m ago'],
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

  let body = '';
  if (step === 1) {
    body = `
      <h1 class="m-setup__title">Who are you<br/>on Letterboxd?</h1>
      <p class="m-setup__lede">We'll fetch your last ~50 watches from your public RSS feed.</p>
      <div class="m-setup__field">
        <span class="m-setup__field-prefix">letterboxd.com/</span>
        <span class="m-setup__field-value">manuelmatheu</span>
        <span class="m-setup__caret"></span>
      </div>
    `;
  } else if (step === 2) {
    body = `
      <h1 class="m-setup__title">Paste your<br/>TMDB token</h1>
      <p class="m-setup__lede">Free + non-commercial. Stored in localStorage only — never on a server.</p>
      <div class="m-setup__token">eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI…</div>
    `;
  } else {
    body = `
      <h1 class="m-setup__title">Drop your<br/>CSV export</h1>
      <p class="m-setup__lede">Optional but recommended. Gives us your full history, not just the recent 50.</p>
      <div class="m-setup__drop">
        <div class="m-setup__drop-prompt">Tap to choose CSV</div>
        <div class="m-setup__drop-sub">stays on your device</div>
      </div>
    `;
  }

  const nextStep = step < total ? step + 1 : null;
  const continueAction = nextStep
    ? `data-action="setup-step" data-step="${nextStep}"`
    : `data-action="finish-setup"`;

  const content = `
    <div class="m-setup">
      <div class="m-setup__progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${step}" aria-label="Setup progress">
        ${progress}
      </div>
      <div class="eyebrow eyebrow--mb-sm">Step ${current.n} · ${current.label}</div>
      ${body}
      <div class="m-setup__footer">
        <button class="m-btn m-btn--bone" ${continueAction}>Continue →</button>
        ${step === 3 ? `<button class="m-btn m-btn--text" data-action="finish-setup">Skip for now</button>` : ''}
      </div>
    </div>
  `;
  return mobileShell({ content, hideFooter: true });
}
