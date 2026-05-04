// TMDB API helpers. Phase 1 only includes token validation;
// /movie endpoints + caching land in Phase 2.

const TMDB_BASE = 'https://api.themoviedb.org/3';

/**
 * Validates a TMDB read access token by hitting the lightweight /configuration
 * endpoint. Returns { ok: true } on success, { ok: false, status, message } otherwise.
 */
export async function validateToken(token) {
  if (!token || token.length < 20) {
    return { ok: false, status: 0, message: 'Token looks too short — paste the full read access token.' };
  }
  try {
    const r = await fetch(`${TMDB_BASE}/configuration`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/json',
      },
    });
    if (r.status === 401 || r.status === 403) {
      return { ok: false, status: r.status, message: 'TMDB rejected this token. Double-check you copied the read access token (not the API key).' };
    }
    if (!r.ok) {
      return { ok: false, status: r.status, message: `TMDB returned ${r.status}.` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, status: 0, message: 'Network error talking to TMDB. Check your connection.' };
  }
}
