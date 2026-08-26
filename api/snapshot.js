const UPSTREAM = "https://stock-ai-8ooa7gdnu-love1234251-9879.vercel.app";

module.exports = async function handler(req, res) {
  try {
    const response = await fetch(UPSTREAM + '/api/snapshot');
    const body = await response.text();
    res.setHeader('content-type', response.headers.get('content-type') || 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(502).json({ ok: false, error: 'Snapshot upstream unavailable' });
  }
};
