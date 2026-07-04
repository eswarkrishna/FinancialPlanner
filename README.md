# US Equity Research

Private research workspace for **US stocks**: market data, daily alerts, strategy backtesting, and a Bloomberg-style dashboard.

## Stack

| Component | Tool |
|-----------|------|
| Market data | [OpenBB](https://github.com/OpenBB-finance/OpenBB) + [yfinance](https://github.com/ranaroussi/yfinance) fallback |
| Daily alerts | Custom scanner + GitHub Actions |
| Backtesting | [backtrader](https://github.com/mementum/backtrader) |
| Dashboard | Streamlit + Plotly candlesticks |

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 1. Daily alert scan

```bash
PYTHONPATH=. python alerts/daily_scan.py
PYTHONPATH=. python alerts/daily_scan.py --notify   # Discord/Telegram if configured
```

### 2. Backtest a strategy

```bash
PYTHONPATH=. python backtests/run_backtest.py --symbol AAPL --fast 10 --slow 30
```

Results are written to `backtests/output/latest.json`.

### 3. Launch dashboard

```bash
PYTHONPATH=. streamlit run dashboard/app.py
```

Opens a local watchlist table and candlestick chart for any symbol in `config/watchlist.yaml`.

## Configuration

Edit `config/watchlist.yaml`:

- `symbols` — US tickers to track
- `alerts.rsi_oversold` / `rsi_overbought` — RSI(14) thresholds
- `alerts.min_daily_change_pct` — flag large daily movers
- `backtest.*` — defaults for `run_backtest.py`

## GitHub Actions (daily alerts)

Workflow: `.github/workflows/daily-alerts.yml`

Runs on weekdays at ~9:30 AM ET. Add repository secrets:

| Secret | Purpose |
|--------|---------|
| `DISCORD_WEBHOOK_URL` | Post alerts to Discord |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Telegram destination chat |

`DATA_PROVIDER` is set to `yfinance` in CI for reliability without extra API keys.

## Project layout

```
config/watchlist.yaml     # Watchlist + alert thresholds
data/fetch.py             # OpenBB / yfinance data layer
alerts/daily_scan.py      # Daily technical scan + notifications
strategies/               # backtrader strategies
backtests/run_backtest.py # Backtest CLI
dashboard/app.py          # Streamlit research desk
tests/                    # pytest unit tests
```

## Connect to GitHub

If you created an empty private repo (e.g. `yourusername/us-equity-research`), push this scaffold:

```bash
./scripts/push-setup.sh yourusername/us-equity-research
```

Or manually:

```bash
git remote add origin https://github.com/yourusername/us-equity-research.git
git push -u origin main
```

## Agent setup (Cursor / Cloud Agents)

This repo includes Cursor agent configuration:

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Agent instructions and command reference |
| `docs/SPEC.md` | Product spec (source of truth) |
| `docs/OVERVIEW.md` | Architecture overview |
| `docs/TASKS.md` | Feature checklist |
| `.cursor/rules/` | Spec-driven and Python conventions |
| `.cursor/skills/` | `equity-create-feature`, `us-equity-research`, etc. |

Start a Cloud Agent on this repo and reference `AGENTS.md` for workflows.

## Tests

```bash
pip install -r requirements.txt
pytest
```

## Disclaimer

For research and education only. Not investment advice. Market data may be delayed or incomplete — verify with your broker before making decisions.
