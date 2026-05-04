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
import { validateToken } from './modules/tmdb.js';
import { fetchRssEntries, parseCsv, mergeHistory } from './modules/letterboxd.js';
import { resolveHistory, RESOLVER_PROGRESS_EVENT } from './modules/resolver.js';

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

  root.innerHTML = html;
  const scroll = root.querySelector('.m-scroll');
  if (scroll) scroll.scrollTop = 0;
}

function findFilmById(id) {
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
    case 'close-film':
      if (window.history.length > 1) window.history.back();
      else navigate('/feed');
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

// File picker feedback for the setup wizard CSV step.
// Direct DOM mutation (no re-render) so we don't blow away the picked file.
root.addEventListener('change', (e) => {
  const target = e.target;
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

// When the resolver completes a batch (every 10 entries), re-render the
// current screen if it shows live data (diary, taste, more) so newly
// resolved posters / enriched genres / refreshed counts appear without
// the user having to refresh.
const LIVE_SCREENS = new Set(['diary', 'taste', 'more']);
window.addEventListener(RESOLVER_PROGRESS_EVENT, () => {
  if (LIVE_SCREENS.has(parseHash().name)) render();
});

// Boot.
gateOrRender();

// If the user is already onboarded and has unresolved entries from a
// previous session (e.g. they closed the tab mid-resolution, or just
// finished setup before this build shipped), kick the resolver again.
if (storage.isOnboarded()) {
  const hasUnresolved = storage.getHistory().some((e) => e.tmdb_id == null);
  if (hasUnresolved) resolveHistory();
}
