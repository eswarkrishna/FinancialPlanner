---
name: equity-verify-with-tests
description: Verifies US Equity Research implementation against docs/SPEC.md §9 acceptance and pytest. Use after changing alerts, fetch, strategies, backtests, or dashboard.
---

# Equity verify with tests

## Automated

```bash
pytest -q
```

Add tests under `tests/`:

- Mock `fetch_history` for alert/backtest unit tests.
- Test pure helpers (RSI, message formatting, OHLCV normalization).
- Avoid network in unit tests; optional integration smoke with `DATA_PROVIDER=yfinance`.

## §9 acceptance mapping

| ID | Command |
|----|---------|
| T1 | `pytest` |
| T2 | `PYTHONPATH=. python3 alerts/daily_scan.py` → valid `alerts/output/latest.json` |
| T3 | `PYTHONPATH=. python3 backtests/run_backtest.py --symbol AAPL` |
| T4 | `PYTHONPATH=. python3 -c "import dashboard.app"` or streamlit import check |

## Before merge

- [ ] pytest green
- [ ] No secrets in diff
- [ ] Spec § cited if behaviour changed
- [ ] Disclaimer still present in dashboard
