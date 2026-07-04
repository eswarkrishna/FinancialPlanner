# US Equity Research — Product Spec

**Version:** 0.1.0  
**Market:** US equities (NYSE, NASDAQ)  
**Status:** Scaffold / MVP

## 1. Purpose

Private research workspace for US stocks: market data, daily alerts, strategy backtesting, and a Bloomberg-style dashboard. **Not** a broker, order router, or investment advisory product.

## 2. Users

- Individual researcher tracking a US watchlist
- Agent-assisted development extending alerts, strategies, and dashboard

## 3. Core capabilities

| ID | Capability | Module | Status |
|----|------------|--------|--------|
| C1 | Fetch OHLCV history | `data/fetch.py` | Done |
| C2 | Daily technical scan + alerts | `alerts/daily_scan.py` | Done |
| C3 | SMA crossover backtest | `strategies/`, `backtests/` | Done |
| C4 | Streamlit research dashboard | `dashboard/app.py` | Done |
| C5 | Scheduled daily alerts (CI) | `.github/workflows/daily-alerts.yml` | Done |

## 4. Data layer (§4)

### 4.1 Providers

- **Primary:** OpenBB (`openbb` package) when available
- **Fallback:** yfinance
- **Selection:** `DATA_PROVIDER` env (`openbb` | `yfinance` | `auto`)

### 4.2 OHLCV schema

Normalized columns: `Open`, `High`, `Low`, `Close`, `Volume`. Index: datetime, ascending.

### 4.3 Quote snapshot

`fetch_quote(symbol)` returns: `symbol`, `price`, `change_pct`, `volume`.

## 5. Alerts (§5)

### 5.1 Inputs

`config/watchlist.yaml`:

- `symbols` — ticker list
- `alerts.rsi_oversold` (default 30)
- `alerts.rsi_overbought` (default 70)
- `alerts.min_daily_change_pct` (default 3.0)
- `alerts.history_days` (default 120)

### 5.2 RSI

RSI(14) on daily close. Standard Wilder-style rolling means on gain/loss.

### 5.3 Alert types

| Type | Trigger |
|------|---------|
| Oversold | RSI ≤ `rsi_oversold` |
| Overbought | RSI ≥ `rsi_overbought` |
| Large mover | \|daily change %\| ≥ `min_daily_change_pct` |

### 5.4 Notifications

Optional via env: Discord webhook, Telegram bot. CLI flag `--notify`.

### 5.5 Output

JSON report at `alerts/output/latest.json` with `rows`, `triggered`, `generated_at`.

## 6. Backtesting (§6)

### 6.1 Engine

backtrader. Commission and initial cash from `config/watchlist.yaml` `backtest` section.

### 6.2 Default strategy

SMA crossover: buy when fast SMA crosses above slow SMA; sell on cross below. Defaults: fast=10, slow=30.

### 6.3 Metrics

`final_value`, `total_return_pct`, `sharpe_ratio`, `max_drawdown_pct`, `total_trades`, `won_trades`.

## 7. Dashboard (§7)

Streamlit app: watchlist table (price, change %, volume), candlestick chart for selected symbol, dark Plotly theme.

## 8. Configuration (§8)

Single YAML: `config/watchlist.yaml`. No database. Secrets in `.env` (never committed).

## 9. Acceptance tests (§9)

| ID | Check |
|----|-------|
| T1 | `pytest` passes |
| T2 | `daily_scan.py` produces valid JSON for current watchlist |
| T3 | `run_backtest.py --symbol AAPL` writes `backtests/output/latest.json` |
| T4 | `streamlit run dashboard/app.py` starts without import errors |

## 10. Non-goals (§10)

- Live order execution or broker integration
- Options/futures pricing (equities only for now)
- Tax or legal investment advice
- Real-time sub-second streaming (daily/EOD focus)

## 11. Disclaimer (§11)

All UI and reports must include or reference: *For research and education only. Not investment advice.*
