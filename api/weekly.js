const FINMIND_URL = 'https://api.finmindtrade.com/api/v4/data';
const LOOKBACK_DAYS = 1100;

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

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const stockId = String(req.query.stock_id || '').trim().toUpperCase();
  if (!/^[0-9A-Z]{4,6}$/.test(stockId)) {
    return res.status(400).json({ ok: false, error: 'Valid stock_id is required' });
  }

  try {
    const endDate = taipeiDate();
    const startDate = shiftDate(endDate, -LOOKBACK_DAYS);
    const params = new URLSearchParams({
      dataset: 'TaiwanStockPrice',
      data_id: stockId,
      start_date: startDate,
      end_date: endDate
    });
    const headers = {};
    if (process.env.FINMIND_TOKEN) headers.Authorization = `Bearer ${process.env.FINMIND_TOKEN}`;

    const response = await fetch(`${FINMIND_URL}?${params}`, { headers });
    if (!response.ok) throw new Error(`FinMind returned ${response.status}`);
    const payload = await response.json();
    if (payload.status && payload.status !== 200) throw new Error(payload.msg || 'FinMind request failed');

    const history = (Array.isArray(payload.data) ? payload.data : [])
      .map(item => ({
        date: String(item.date || ''),
        o: number(item.open),
        h: number(item.max),
        l: number(item.min),
        c: number(item.close),
        v: number(item.Trading_Volume) == null ? null : number(item.Trading_Volume) / 1000
      }))
      .filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.date) && [item.o, item.h, item.l, item.c, item.v].every(Number.isFinite))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!history.length) return res.status(404).json({ ok: false, error: 'No price history found' });

    res.setHeader('cache-control', 'public, s-maxage=1800, stale-while-revalidate=21600');
    return res.status(200).json({
      ok: true,
      stock_id: stockId,
      source: 'FinMind TaiwanStockPrice',
      start_date: history[0].date,
      as_of: history[history.length - 1].date,
      history
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'Weekly history upstream unavailable',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
