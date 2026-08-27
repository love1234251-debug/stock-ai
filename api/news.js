const FINMIND_URL = 'https://api.finmindtrade.com/api/v4/data';
const MAX_ITEMS = 12;
const LOOKBACK_DAYS = 6;

function taipeiDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function shiftDate(date, days) {
  const value = new Date(date + 'T00:00:00Z');
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function plainText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchDay(stockId, date) {
  const params = new URLSearchParams({
    dataset: 'TaiwanStockNews',
    data_id: stockId,
    start_date: date
  });
  const headers = {};
  if (process.env.FINMIND_TOKEN) headers.Authorization = `Bearer ${process.env.FINMIND_TOKEN}`;
  const response = await fetch(`${FINMIND_URL}?${params}`, { headers });
  if (!response.ok) throw new Error(`FinMind returned ${response.status}`);
  const payload = await response.json();
  if (payload.status && payload.status !== 200) throw new Error(payload.msg || 'FinMind request failed');
  return Array.isArray(payload.data) ? payload.data : [];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const stockId = String(req.query.stock_id || '').trim().toUpperCase();
  if (!/^[0-9A-Z]{4,6}$/.test(stockId)) {
    return res.status(400).json({ ok: false, error: 'Valid stock_id is required' });
  }

  try {
    const today = taipeiDate();
    const collected = [];
    for (let offset = 0; offset < LOOKBACK_DAYS && collected.length === 0; offset += 1) {
      const rows = await fetchDay(stockId, shiftDate(today, -offset));
      collected.push(...rows);
    }

    const seen = new Set();
    const news = collected
      .map(item => ({
        date: String(item.date || ''),
        title: plainText(item.title),
        source: plainText(item.source) || '未知來源',
        url: safeUrl(item.link),
        description: plainText(item.description)
      }))
      .filter(item => item.title && item.url && !seen.has(item.url) && seen.add(item.url))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_ITEMS);

    res.setHeader('cache-control', 'public, s-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json({
      ok: true,
      stock_id: stockId,
      source: 'FinMind TaiwanStockNews',
      as_of: news[0]?.date || today,
      news
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'News upstream unavailable',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
