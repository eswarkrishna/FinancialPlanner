# US Equity Research — Overview

## What this is

A Python research workspace for **US listed equities**: pull market data, scan a watchlist for technical alerts, backtest simple strategies, and view results in a Streamlit dashboard.

## Architecture

```
config/watchlist.yaml
        │
        ▼
  data/fetch.py  ◄── OpenBB / yfinance
        │
   ┌────┴────┬──────────────┐
   ▼         ▼              ▼
alerts/  backtests/    dashboard/
daily_scan  run_backtest   app.py (Streamlit)
   │
   ▼
GitHub Actions (weekday cron)
```

## Doc map

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Requirements, formulas, acceptance tests |
| [TASKS.md](./TASKS.md) | Feature checklist for agents |
| [OVERVIEW.md](./OVERVIEW.md) | This file — onboarding |
| [../AGENTS.md](../AGENTS.md) | Cursor / Cloud Agent instructions |
| [../README.md](../README.md) | User quick start |

## Key modules

| Path | Responsibility |
|------|----------------|
| `data/fetch.py` | Provider abstraction, OHLCV normalization |
| `alerts/daily_scan.py` | RSI + mover scan, Discord/Telegram |
| `strategies/sma_crossover.py` | Reference backtrader strategy |
| `backtests/run_backtest.py` | CLI backtest runner |
| `dashboard/app.py` | Watchlist + candlestick UI |

## Stack

- **Python 3.11+**
- **OpenBB** + **yfinance** — market data
- **backtrader** — backtesting
- **Streamlit** + **Plotly** — dashboard
- **pytest** — tests
- **GitHub Actions** — scheduled alerts

## Environment

- `PYTHONPATH=.` required when running modules from repo root
- `.env` for optional notification credentials (see `.env.example`)
- CI uses `DATA_PROVIDER=yfinance` for reliability without API keys
