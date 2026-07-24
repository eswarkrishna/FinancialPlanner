---
name: equity-implement-from-spec
description: Implements US Equity Research features strictly from docs/SPEC.md. Use when mapping spec sections to data/, alerts/, strategies/, backtests/, or dashboard/ code.
---

# Equity implement from spec

## Mapping

| Spec | Code |
|------|------|
| §4 Data | `data/fetch.py` |
| §5 Alerts | `alerts/daily_scan.py`, `config/watchlist.yaml` |
| §6 Backtesting | `strategies/`, `backtests/run_backtest.py` |
| §7 Dashboard | `dashboard/app.py` |
| §8 Config | `config/watchlist.yaml`, `.env.example` |

## Rules

- Minimal diff; match existing module style.
- New strategy = new file in `strategies/` + wire in backtest runner if default.
- Alert rules read from YAML; implement logic in pure functions where possible.
- Cite spec § in commit message (e.g. `feat(alerts): add volume spike rule §5.3`).

## Do not

- Bypass `data/fetch.py` for OHLCV.
- Add broker/trading execution (§10).
- Remove §11 disclaimer from dashboard.
