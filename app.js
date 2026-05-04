// CineMatch app entry — state, hash routing, render, event delegation.
// Phase 0 prototype against fixture data. Real Letterboxd/TMDB integration lands in Phase 1+.

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

const root = document.getElementById('root');

// Single tab routes — anything not in this map is treated as a special route.
const TAB_ROUTES = {
  feed: feedScreen,
  upcoming: upcomingScreen,
  taste: tasteScreen,
  diary: diaryScreen,
  more: moreScreen,
};

// === Routing =========================================================
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
    // Same hash → no popstate event, force a re-render.
    render();
  } else {
    window.location.hash = path;
  }
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
  // Reset scroll on screen change so users land at the top of each view.
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

// === Event delegation ================================================
root.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  switch (action) {
    case 'tab': {
      navigate(`/${target.dataset.tab}`);
      break;
    }
    case 'open-film': {
      navigate(`/detail/${target.dataset.filmId}`);
      break;
    }
    case 'close-film': {
      // Prefer the browser back stack so swipe-back / hardware back works.
      if (window.history.length > 1) window.history.back();
      else navigate('/feed');
      break;
    }
    case 'setup-step': {
      navigate(`/setup/${target.dataset.step}`);
      break;
    }
    case 'open-setup': {
      navigate('/setup/1');
      break;
    }
    case 'finish-setup': {
      navigate('/feed');
      break;
    }
    case 'refresh': {
      // No-op for the static prototype. Real RSS sync ships in Phase 1.
      break;
    }
    default:
      break;
  }
});

window.addEventListener('hashchange', render);

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

// Boot.
render();
