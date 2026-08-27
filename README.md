# stock-ai

## Deployment

Connected to Vercel production from the `main` branch.

## Data APIs

- `/api/snapshot` — TWSE market and stock snapshots.
- `/api/context?stock_id=2330` — FinMind price history, revenue, and institutional data.
- `/api/news?stock_id=2330` — recent FinMind `TaiwanStockNews` headlines with source and original link.

News is presented as a verifiable source list. Stock AI does not automatically treat a headline as the cause of a price move.
