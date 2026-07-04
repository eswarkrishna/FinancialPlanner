# Agent instructions — US Equity Research

This repository is **spec-driven**. Treat `docs/SPEC.md` as the source of truth for alerts, data contracts, backtesting behaviour, and acceptance tests.

**Orientation:** For architecture and doc map, see **`docs/OVERVIEW.md`**.

## Before implementing

1. Read the relevant sections of `docs/SPEC.md` (cite section numbers in commits/PRs when useful).
2. Prefer **small, test-backed changes** mapped to a spec subsection (e.g. §5 alerts, §6 backtesting).
3. When behaviour changes, update **pytest** tests under `tests/`.
4. Run with `PYTHONPATH=.` from the repo root unless using `pytest` (configured in `pyproject.toml`).

## Engineering defaults

- **Stack:** Python 3.11+, OpenBB, yfinance, backtrader, Streamlit, pytest.
- **Config:** `config/watchlist.yaml` for symbols and thresholds; secrets in `.env` only.
- **Data:** Use `data/fetch.py` — do not duplicate provider logic in alerts/backtests/dashboard.
- **Market:** US equities only unless spec is updated.

## Do not

- Implement items in **§10 Non-goals** without a spec revision.
- Give investment, tax, or legal advice beyond the §11 disclaimer.
- Commit `.env`, API keys, or webhook URLs.
- Add live trading or broker order placement.

## Cursor project assets

- Rules: `.cursor/rules/`
- Hooks: `.cursor/hooks.json` + `.cursor/hooks/`
- Skills: `.cursor/skills/`

### Development skills (`.cursor/skills/`)

| Order | Skill | Role |
|------:|-------|------|
| ★ | `equity-create-feature` | Orchestrate: intake → spec → implement → test → docs |
| 1 | `equity-implement-from-spec` | Map `docs/SPEC.md` § to Python modules |
| 2 | `us-equity-research` | Domain: OpenBB, backtrader, alerts, Streamlit |
| 3 | `equity-verify-with-tests` | pytest, §9 acceptance, smoke commands |
| — | `equity-create-feature` | Also see `docs/TASKS.md` checklist |

## Cursor Cloud specific instructions

Python-only project — no Node, Docker, or database required.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `pip install -r requirements.txt` |
| Unit tests | `pytest` |
| Daily scan | `PYTHONPATH=. python3 alerts/daily_scan.py` |
| Backtest | `PYTHONPATH=. python3 backtests/run_backtest.py --symbol AAPL` |
| Dashboard | `PYTHONPATH=. streamlit run dashboard/app.py` |

### Notes for cloud agents

- **Python 3.11+** recommended (matches CI).
- Set `DATA_PROVIDER=yfinance` in CI or when OpenBB install is slow; `auto` tries OpenBB first locally.
- Network required for data fetch smoke tests; unit tests mock `fetch_history`.
- GitHub Actions daily workflow: `.github/workflows/daily-alerts.yml` (weekdays ~9:30 AM ET).
- Optional notify secrets: `DISCORD_WEBHOOK_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- Disclaimer (§11) must remain in dashboard and user-facing outputs.
