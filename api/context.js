const UPSTREAM = "https://stock-ai-8ooa7gdnu-love1234251-9879.vercel.app";

module.exports = async function handler(req, res) {
  try {
    const stockId = String(req.query.stock_id || '').trim();
    if (!stockId) return res.status(400).json({ ok: false, error: 'stock_id is required' });
    const response = await fetch(UPSTREAM + '/api/context?stock_id=' + encodeURIComponent(stockId));
    const body = await response.text();
    res.setHeader('content-type', response.headers.get('content-type') || 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'public, s-maxage=300, stale-while-revalidate=900');
    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(502).json({ ok: false, error: 'Context upstream unavailable' });
  }
};
