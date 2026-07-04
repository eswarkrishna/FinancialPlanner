---
name: equity-create-feature
description: Orchestrates a new US Equity Research feature end-to-end using docs/SPEC.md. Use when adding alerts, strategies, dashboard panels, data providers, or shipping a full slice of work.
---

# Equity create feature

Orchestrate delivery for **us-equity-research**.

## Workflow

1. **Intake** — Clarify scope against `docs/SPEC.md` §10 non-goals.
2. **Spec** — Add or update `docs/SPEC.md` section(s) with behaviour and acceptance criteria.
3. **Tasks** — Add checklist items to `docs/TASKS.md`.
4. **Implement** — Use `equity-implement-from-spec` and `us-equity-research` skills.
5. **Test** — Use `equity-verify-with-tests`; add pytest for new logic.
6. **Docs** — Update `README.md` / `docs/OVERVIEW.md` if user-facing.
7. **Ship** — Commit with spec § references; ensure disclaimer preserved.

## Checklist

- [ ] Spec section written
- [ ] `data/fetch.py` used for new data needs (no duplicate providers)
- [ ] Config in `config/watchlist.yaml` when thresholds/symbols change
- [ ] `pytest` green
- [ ] Smoke: scan, backtest, or dashboard as relevant
- [ ] `docs/TASKS.md` updated

## Commands

```bash
pip install -r requirements.txt
pytest
PYTHONPATH=. python3 alerts/daily_scan.py
PYTHONPATH=. python3 backtests/run_backtest.py --symbol AAPL
```
