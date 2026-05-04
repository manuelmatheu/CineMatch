// localStorage helpers — single source of truth for keys and shape.
// Schema documented in CLAUDE.md → "localStorage Schema" section.
//
// Module-level guard so this file imports cleanly in non-browser contexts
// (node smoke tests, server-side rendering experiments). In those contexts
// every getter returns null and every setter is a no-op.

const HAS_STORAGE = typeof globalThis !== 'undefined'
  && typeof globalThis.localStorage !== 'undefined';
const ls = HAS_STORAGE ? globalThis.localStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const KEYS = {
  username: 'cinematch_username',
  token: 'cinematch_tmdb_token',
  history: 'cinematch_watch_history',
  lastSync: 'cinematch_last_rss_fetch',
  tasteProfile: 'cinematch_taste_profile',
  tmdbCache: 'cinematch_tmdb_cache',
};

export const storage = {
  getUsername: () => ls.getItem(KEYS.username),
  setUsername: (v) => ls.setItem(KEYS.username, v),

  getToken: () => ls.getItem(KEYS.token),
  setToken: (v) => ls.setItem(KEYS.token, v),

  getHistory: () => {
    try {
      return JSON.parse(ls.getItem(KEYS.history) || '[]');
    } catch {
      return [];
    }
  },
  setHistory: (arr) => ls.setItem(KEYS.history, JSON.stringify(arr)),

  getLastSync: () => {
    const raw = ls.getItem(KEYS.lastSync);
    return raw ? Number(raw) : null;
  },
  setLastSync: (ts) => ls.setItem(KEYS.lastSync, String(ts)),

  getTasteProfile: () => {
    try {
      const raw = ls.getItem(KEYS.tasteProfile);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setTasteProfile: (p) => ls.setItem(KEYS.tasteProfile, JSON.stringify(p)),

  isOnboarded: () => Boolean(
    ls.getItem(KEYS.username) && ls.getItem(KEYS.token)
  ),

  reset: () => {
    Object.values(KEYS).forEach((k) => ls.removeItem(k));
  },
};
