# US Equity Research — Task Checklist

Use with **`equity-create-feature`** skill for new work.

## Scaffold (v0.1) — done

- [x] Data layer: OpenBB + yfinance (`data/fetch.py`)
- [x] Watchlist config (`config/watchlist.yaml`)
- [x] Daily alert scanner (`alerts/daily_scan.py`)
- [x] GitHub Actions daily workflow
- [x] SMA crossover strategy + backtest CLI
- [x] Streamlit dashboard
- [x] pytest unit tests
- [x] Agent setup (`AGENTS.md`, `.cursor/`, `docs/SPEC.md`)
- [x] GitHub Actions CI (`pytest` on push/PR)
- [ ] Repository secrets for Discord/Telegram alerts
- [ ] RSI mean-reversion strategy (`strategies/rsi_mean_reversion.py`)
- [ ] Fundamentals panel in dashboard (OpenBB equity fundamentals)
- [ ] Sector/industry grouping in watchlist config
- [ ] Email alert channel (SMTP in `.env`)
- [ ] Golden fixtures for backtest outputs (`tests/fixtures/`)

## Per-feature template

```
- [ ] Spec section updated in docs/SPEC.md
- [ ] Implementation
- [ ] pytest coverage
- [ ] README / OVERVIEW if user-facing
- [ ] Manual smoke (scan, backtest, or dashboard)
```
