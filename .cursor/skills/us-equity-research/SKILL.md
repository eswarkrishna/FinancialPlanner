---
name: us-equity-research
description: Domain and implementation guide for US Equity Research — OpenBB/yfinance data, RSI alerts, backtrader strategies, Streamlit dashboard, GitHub Actions. Use for stock analysis, backtesting, or market data work in this repo.
---

# US Equity Research domain

## Data (`data/fetch.py`)

```python
from data.fetch import fetch_history, fetch_quote, load_watchlist

df = fetch_history("AAPL", start="2024-01-01", end="2024-12-31")
quote = fetch_quote("AAPL")
config = load_watchlist("config/watchlist.yaml")
```

- `DATA_PROVIDER=auto` → OpenBB then yfinance fallback.
- CI: prefer `yfinance` for reliability.

## Alerts (`alerts/daily_scan.py`)

- RSI(14) oversold/overbought from `config/watchlist.yaml`.
- Large mover = \|daily change %\| threshold.
- `--notify` sends Discord/Telegram when env vars set.

## Backtesting (`strategies/`, `backtests/`)

- backtrader + `PandasData` feed from `fetch_history`.
- Reference strategy: `SmaCrossover` in `strategies/sma_crossover.py`.
- Output JSON: `backtests/output/latest.json`.

## Dashboard (`dashboard/app.py`)

- Streamlit: watchlist table + Plotly candlesticks.
- Run: `PYTHONPATH=. streamlit run dashboard/app.py`

## Watchlist config

```yaml
symbols: [AAPL, MSFT]
alerts:
  rsi_oversold: 30
  rsi_overbought: 70
  min_daily_change_pct: 3.0
```

## Disclaimer

Always include: *For research and education only. Not investment advice.*
