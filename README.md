# stock-ai

## Deployment

Connected to Vercel production from the `main` branch.

## Data APIs

- `/api/snapshot` — TWSE market and stock snapshots.
- `/api/context?stock_id=2330` — FinMind price history, revenue, and institutional data.
- `/api/weekly?stock_id=2330` — three years of FinMind price history for weekly MA, RSI, volume, and OBV analysis.
- `/api/news?stock_id=2330` — recent FinMind `TaiwanStockNews` headlines with source and original link.

News is presented as a verifiable source list. Stock AI does not automatically treat a headline as the cause of a price move.

The weekly war room calculates 5/10/20-week moving averages, Wilder RSI, OBV with 30/60-week averages, key price zones, conditional A/B/C scenarios, factor scores, and a four-stage observation path. These are rule-based technical observations rather than guaranteed forecasts.
