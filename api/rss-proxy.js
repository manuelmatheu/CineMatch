// Vercel serverless proxy for Letterboxd RSS.
// Letterboxd's RSS feed has no CORS headers, so the browser can't fetch it
// directly. This proxy fetches the XML server-side and returns it verbatim.
//
// Usage: GET /api/rss-proxy?username=manuelmatheu
//
// Status codes:
//   200 — success, returns RSS XML
//   400 — missing or malformed username
//   404 — Letterboxd returned 404 (user doesn't exist)
//   502 — Letterboxd unreachable or returned an error
//
// Cached for 5 min on Vercel's edge to avoid hammering Letterboxd during dev.

const USERNAME_PATTERN = /^[a-z0-9_-]{1,40}$/i;

export default async function handler(req, res) {
  const username = String(req.query.username || '').trim();

  if (!username) {
    return res.status(400).json({ error: 'Missing required query param: username' });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return res.status(400).json({ error: 'Invalid Letterboxd username format' });
  }

  const url = `https://letterboxd.com/${username}/rss/`;

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'CineMatch/0.1 (+https://github.com/manuelmatheu/CineMatch)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (upstream.status === 404) {
      return res.status(404).json({ error: `No Letterboxd user named "${username}"` });
    }
    if (!upstream.ok) {
      return res.status(502).json({ error: `Letterboxd returned ${upstream.status}` });
    }

    const xml = await upstream.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(xml);
  } catch (err) {
    return res.status(502).json({ error: 'Letterboxd unreachable', detail: String(err) });
  }
}
