// CineMatch app entry — state, hash routing, render, event delegation.

import { CINEMATCH_DATA } from './modules/data.js';
import {
  feedScreen,
  detailScreen,
  upcomingScreen,
  tasteScreen,
  diaryScreen,
  moreScreen,
  setupScreen,
} from './modules/screens.js';
import { storage } from './modules/storage.js';
import { DESKTOP_QUERY } from './modules/ui.js';
import { validateToken, getMovieTrailerUrl } from './modules/tmdb.js';
import { fetchRssEntries, parseCsv, mergeHistory } from './modules/letterboxd.js';
import { resolveHistory, RESOLVER_PROGRESS_EVENT } from './modules/resolver.js';
import { buildRecommendations, RECOMMENDATIONS_PROGRESS_EVENT } from './modules/recommendations.js';
import { buildUpcoming, UPCOMING_PROGRESS_EVENT } from './modules/upcoming.js';
import {
  syncWithLetterboxd,
  importCsvFile,
  exportRecommendationsCsv,
  resetEverything,
} from './modules/sync.js';
import { notify } from './modules/notify.js';

const root = document.getElementById('root');

const TAB_ROUTES = {
  feed: feedScreen,
  upcoming: upcomingScreen,
  taste: tasteScreen,
  diary: diaryScreen,
  more: moreScreen,
};

// === Routing ==========================================================
// Hash format examples: "", "#/", "#/upcoming", "#/detail/3", "#/setup/2"
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { name: 'feed' };
  const [head, arg] = raw.split('/');
  if (head === 'detail' && arg) return { name: 'detail', filmId: Number(arg) };
  if (head === 'setup') return { name: 'setup', step: Number(arg) || 1 };
  if (TAB_ROUTES[head]) return { name: head };
  return { name: 'feed' };
}

function navigate(path) {
  if (window.location.hash === `#${path}`) {
    render();
  } else {
    window.location.hash = path;
  }
}

// === First-run gate ===================================================
// If the user hasn't completed onboarding, send them to setup before
// anything else renders. They can still navigate within /setup/* though.
function gateOrRender() {
  const route = parseHash();
  if (!storage.isOnboarded() && route.name !== 'setup') {
    window.location.hash = '/setup/1';
    return;
  }
  render();
}

// === Render ==========================================================
// Track the last rendered route so incremental re-renders (resolver progress,
// recommendations progress, etc.) don't reset scroll position. Only navigation
// to a new screen — or a new film in detail view — should scroll back to top.
let lastRenderedRouteKey = null;
function render() {
  const route = parseHash();
  let html = '';

  if (route.name === 'detail') {
    const film = findFilmById(route.filmId);
    html = detailScreen(film);
  } else if (route.name === 'setup') {
    html = setupScreen(route.step);
  } else if (TAB_ROUTES[route.name]) {
    html = TAB_ROUTES[route.name]();
  } else {
    html = feedScreen();
  }

  const routeKey = route.name === 'detail'
    ? `detail:${route.filmId}`
    : route.name === 'setup'
      ? `setup:${route.step}`
      : route.name;
  const routeChanged = routeKey !== lastRenderedRouteKey;

  // Capture current scroll before innerHTML wipes the .m-scroll element, so
  // background re-renders (resolver progress) don't yank the user back to top.
  const previousScroll = !routeChanged
    ? (root.querySelector('.m-scroll')?.scrollTop ?? 0)
    : 0;

  root.innerHTML = html;
  const scroll = root.querySelector('.m-scroll');
  if (scroll) scroll.scrollTop = routeChanged ? 0 : previousScroll;
  lastRenderedRouteKey = routeKey;
}

function findFilmById(id) {
  // Live recommendations first (Phase 4) — keyed by tmdb_id.
  const recsBlob = storage.getRecommendations();
  const fromRecs = recsBlob?.items?.find((r) => r.tmdb_id === id);
  if (fromRecs) {
    return {
      id: fromRecs.tmdb_id,
      title: fromRecs.title,
      year: fromRecs.year,
      poster_path: fromRecs.poster_path,
      score: fromRecs.match,
      genres: fromRecs.genres,
      because: fromRecs.because,
      because_rating: fromRecs.because_rating,
      overview: fromRecs.overview,
    };
  }

  // Live upcoming (Phase 5) — also keyed by tmdb_id.
  const upcomingBlob = storage.getUpcoming();
  const fromUpcoming = upcomingBlob?.items?.find((u) => u.tmdb_id === id);
  if (fromUpcoming) {
    return {
      id: fromUpcoming.tmdb_id,
      title: fromUpcoming.title,
      year: fromUpcoming.year,
      poster_path: fromUpcoming.poster_path,
      score: 0.85, // upcoming films don't have a "match score" — use a neutral display value
      genres: fromUpcoming.genres,
      overview: fromUpcoming.overview,
      tagline: `Releases ${fromUpcoming.release_date}`,
    };
  }

  // Fixture fallback (legacy — used while older /detail/{id} links resolve).
  if (CINEMATCH_DATA.hero.id === id) return CINEMATCH_DATA.hero;
  return (
    CINEMATCH_DATA.recommendations.find((f) => f.id === id) ||
    CINEMATCH_DATA.upcoming.find((f) => f.id === id) ||
    CINEMATCH_DATA.hero
  );
}

// === Setup wizard helpers =============================================
const USERNAME_PATTERN = /^[a-z0-9_-]{1,40}$/i;

function showError(msg) {
  const el = document.getElementById('setup-error');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}
function clearError() {
  const el = document.getElementById('setup-error');
  if (el) el.hidden = true;
}
function setBusy(busy, label) {
  const btn = document.getElementById('setup-continue');
  if (!btn) return;
  btn.setAttribute('aria-busy', busy ? 'true' : 'false');
  if (label) btn.textContent = label;
  if (!busy) btn.textContent = 'Continue →';
}

async function handleSetup1Continue() {
  clearError();
  const input = document.getElementById('setup-username');
  const username = (input?.value || '').trim();
  if (!username) return showError('Enter your Letterboxd username to continue.');
  if (!USERNAME_PATTERN.test(username)) {
    return showError('Letterboxd usernames are letters, numbers, dashes, or underscores.');
  }
  storage.setUsername(username);
  navigate('/setup/2');
}

async function handleSetup2Continue() {
  clearError();
  const input = document.getElementById('setup-tmdb-token');
  const token = (input?.value || '').trim();
  if (!token) return showError('Paste your TMDB read access token to continue.');

  setBusy(true, 'Checking…');
  const result = await validateToken(token);
  setBusy(false);

  if (!result.ok) return showError(result.message || 'Could not validate token.');
  storage.setToken(token);
  navigate('/setup/3');
}

async function handleSetup3Finish({ includeCsv }) {
  clearError();
  const username = storage.getUsername();
  if (!username) return navigate('/setup/1');

  let csvEntries = [];
  if (includeCsv) {
    const fileInput = document.getElementById('setup-csv-input');
    const file = fileInput?.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        csvEntries = parseCsv(text);
      } catch (err) {
        return showError(err.message || 'Could not read the CSV file.');
      }
    }
  }

  setBusy(true, 'Fetching diary…');
  let rssEntries = [];
  try {
    rssEntries = await fetchRssEntries(username);
  } catch (err) {
    setBusy(false);
    return showError(`${err.message}. You can still continue — we'll retry later.`);
  }

  const merged = mergeHistory(rssEntries, csvEntries);
  storage.setHistory(merged);
  storage.setLastSync(Date.now());

  // Per Phase 1 exit criteria: log the merge result so the user can verify.
  // eslint-disable-next-line no-console
  console.log(
    `[CineMatch] ${merged.length} films loaded ` +
    `(${csvEntries.length} from CSV, ${rssEntries.length} from RSS)`
  );

  setBusy(false);
  navigate('/feed');

  // Kick off background TMDB resolution. Doesn't block navigation; the
  // diary screen re-renders as posters arrive.
  resolveHistory();
}

// === Event delegation ================================================
root.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  switch (action) {
    case 'tab':
      navigate(`/${target.dataset.tab}`);
      break;
    case 'open-film':
      navigate(`/detail/${target.dataset.filmId}`);
      break;
    case 'open-rec':
      navigate(`/detail/${target.dataset.tmdbId}`);
      break;
    case 'refresh-recs':
      buildRecommendations().catch((err) => {
        console.warn('[CineMatch] manual rec rebuild failed', err);
        notify(err.message || 'Could not rebuild recommendations.', 'error');
      });
      break;
    case 'refresh-upcoming':
      buildUpcoming({ force: true }).catch((err) => {
        console.warn('[CineMatch] manual upcoming rebuild failed', err);
        notify(err.message || 'Could not refresh upcoming.', 'error');
      });
      break;
    case 'sync-letterboxd':
      handleSyncLetterboxd(target);
      break;
    case 'export-recs':
      handleExportRecs();
      break;
    case 'reset-app':
      handleResetApp();
      break;
    case 'close-film':
      if (window.history.length > 1) window.history.back();
      else navigate('/feed');
      break;
    case 'open-trailer':
      handleOpenTrailer(target);
      break;
    case 'mark-watched':
      handleMarkWatched(target);
      break;
    case 'open-setup':
      navigate('/setup/1');
      break;
    case 'setup-1-continue':
      handleSetup1Continue();
      break;
    case 'setup-2-continue':
      handleSetup2Continue();
      break;
    case 'setup-3-continue':
      handleSetup3Finish({ includeCsv: true });
      break;
    case 'setup-3-skip':
      handleSetup3Finish({ includeCsv: false });
      break;
    case 'finish-setup':
      navigate('/feed');
      break;
    case 'refresh':
      // No-op for the static prototype. Real RSS sync ships in Phase 1+.
      break;
    default:
      break;
  }
});

// === More-screen action handlers =====================================
async function handleSyncLetterboxd(btn) {
  const original = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Syncing…';
  }
  try {
    const { added, ratingChanged } = await syncWithLetterboxd();
    if (added === 0 && ratingChanged === 0) {
      notify('Already in sync — nothing new on Letterboxd.', 'info');
    } else {
      const parts = [];
      if (added > 0) parts.push(`${added} new`);
      if (ratingChanged > 0) parts.push(`${ratingChanged} re-rated`);
      notify(`Synced ${parts.join(' · ')}.`, 'success');
    }
    render();
  } catch (err) {
    notify(err.message || 'Sync failed.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      if (original) btn.textContent = original;
    }
  }
}

async function handleMoreCsvPick(input) {
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const { added, ratingChanged } = await importCsvFile(file);
    if (added === 0 && ratingChanged === 0) {
      notify('CSV merged — no new entries.', 'info');
    } else {
      const parts = [];
      if (added > 0) parts.push(`${added} new`);
      if (ratingChanged > 0) parts.push(`${ratingChanged} re-rated`);
      notify(`Imported ${parts.join(' · ')}.`, 'success');
    }
    render();
  } catch (err) {
    notify(err.message || 'CSV import failed.', 'error');
  } finally {
    // Clear the input so picking the same file again still fires `change`.
    input.value = '';
  }
}

function handleExportRecs() {
  try {
    const n = exportRecommendationsCsv();
    notify(`Exported ${n} recommendations.`, 'success');
  } catch (err) {
    notify(err.message || 'Export failed.', 'error');
  }
}

// === Detail-screen action handlers ===================================
// Trailer button: open the popup synchronously (Safari blocks window.open
// after async work) and navigate it once TMDB returns the YouTube URL.
async function handleOpenTrailer(btn) {
  const id = Number(btn?.dataset?.tmdbId);
  const title = btn?.dataset?.title || 'this film';
  if (!id) return notify('No trailer available — film is missing a TMDB id.', 'error');

  const token = storage.getToken();
  if (!token) return notify('TMDB token missing — re-run setup.', 'error');

  const popup = window.open('', '_blank', 'noopener');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Loading…';
  try {
    const url = await getMovieTrailerUrl(id, token);
    if (!url) {
      if (popup) popup.close();
      notify(`No trailer on TMDB for ${title}.`, 'info');
      return;
    }
    if (popup) popup.location.href = url;
    else window.open(url, '_blank', 'noopener'); // pop-up blocker fallback
  } catch (err) {
    if (popup) popup.close();
    console.warn('[CineMatch] trailer fetch failed', err);
    notify(err.message || 'Could not load trailer.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

// "Already watched": append the film to local history with no rating, so it
// stops surfacing in recommendations. Triggers a recs rebuild in the background.
function handleMarkWatched(btn) {
  const id = Number(btn?.dataset?.tmdbId);
  const title = btn?.dataset?.title || '';
  const year = btn?.dataset?.year ? Number(btn.dataset.year) : null;
  const posterPath = btn?.dataset?.posterPath || null;
  if (!id || !title) return;

  const history = storage.getHistory();
  if (history.some((e) => e.tmdb_id === id)) {
    notify(`${title} is already in your diary.`, 'info');
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  history.push({
    title,
    year,
    rating: null,
    watched_date: today,
    rewatch: false,
    source: 'manual',
    tmdb_id: id,
    poster_path: posterPath || null,
    letterboxd_uri: null,
  });
  storage.setHistory(history);
  notify(`Marked ${title} as watched.`, 'success');

  // Rebuild recs in background so the watched film drops out of "More for you".
  buildRecommendations().catch((err) => {
    console.warn('[CineMatch] post-watched rec rebuild failed', err);
  });

  // Bounce the user back so they see the updated feed/diary.
  if (window.history.length > 1) window.history.back();
  else navigate('/feed');
}

function handleResetApp() {
  const ok = window.confirm(
    'Reset everything?\n\nThis wipes your Letterboxd link, TMDB token, history, taste profile, recommendations, and upcoming cache. You will be returned to setup.'
  );
  if (!ok) return;
  resetEverything();
  notify('Reset complete.', 'info');
  window.location.hash = '/setup/1';
}

// File picker feedback for the setup wizard CSV step.
// Direct DOM mutation (no re-render) so we don't blow away the picked file.
root.addEventListener('change', (e) => {
  const target = e.target;
  if (target.dataset && target.dataset.action === 'more-csv-pick') {
    handleMoreCsvPick(target);
    return;
  }
  if (target.dataset && target.dataset.action === 'csv-pick') {
    const file = target.files && target.files[0];
    const label = document.getElementById('setup-csv-label');
    if (!label) return;
    const prompt = label.querySelector('.m-setup__drop-prompt');
    const sub = label.querySelector('.m-setup__drop-sub');
    if (file) {
      label.classList.add('is-filled');
      if (prompt) prompt.textContent = file.name;
      if (sub) sub.textContent = `${(file.size / 1024).toFixed(1)} KB · ready`;
    } else {
      label.classList.remove('is-filled');
      if (prompt) prompt.textContent = 'Tap to choose CSV';
      if (sub) sub.textContent = 'stays on your device';
    }
  }
});

window.addEventListener('hashchange', render);

// Re-render when the desktop breakpoint flips so the correct nav
// surface (sidebar vs tabbar) is in the DOM, not just hidden via CSS.
if (DESKTOP_QUERY.addEventListener) {
  DESKTOP_QUERY.addEventListener('change', render);
}

// When background work emits progress, re-render the current screen if
// it shows live data — coalesced via rAF so a flood of resolver events
// (one per TMDB hit) collapses into one paint per frame instead of
// rebuilding the whole DOM 3+ times per second.
const LIVE_SCREENS = new Set(['feed', 'diary', 'taste', 'more']);
let renderQueued = false;
function renderSoon() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

window.addEventListener(RESOLVER_PROGRESS_EVENT, () => {
  if (LIVE_SCREENS.has(parseHash().name)) renderSoon();
});
window.addEventListener(RECOMMENDATIONS_PROGRESS_EVENT, () => {
  if (parseHash().name === 'feed') renderSoon();
});
window.addEventListener(UPCOMING_PROGRESS_EVENT, () => {
  if (parseHash().name === 'upcoming') renderSoon();
});

// Service worker — caches the app shell + TMDB poster images so the app
// keeps working offline (against the localStorage data we already hold).
// Skip on file:// previews and HTTP loopback edge cases where SW won't
// register cleanly anyway.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('[CineMatch] SW registration failed', err);
    });
  });
}

// Boot.
gateOrRender();

// If the user is already onboarded and has unresolved entries from a
// previous session (e.g. they closed the tab mid-resolution, or just
// finished setup before this build shipped), kick the resolver again.
if (storage.isOnboarded()) {
  const hasUnresolved = storage.getHistory().some((e) => e.tmdb_id == null);
  if (hasUnresolved) {
    resolveHistory();
  } else {
    // No resolution work to do, but the upcoming-releases cache may have
    // expired since last visit (7-day TTL). buildUpcoming is a no-op when
    // the cache is fresh, so calling it on every boot is cheap.
    buildUpcoming().catch(() => {});
  }
}
