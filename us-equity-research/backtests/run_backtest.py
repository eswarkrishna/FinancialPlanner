"""Backtest runner."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import backtrader as bt
import pandas as pd

from data.fetch import fetch_history, load_watchlist
from strategies.sma_crossover import SmaCrossover


class PandasData(bt.feeds.PandasData):
    params = (
        ("datetime", None),
        ("open", "Open"),
        ("high", "High"),
        ("low", "Low"),
        ("close", "Close"),
        ("volume", "Volume"),
        ("openinterest", -1),
    )


def run_backtest(
    symbol: str,
    start: str,
    end: str | None,
    cash: float,
    commission: float,
    fast: int,
    slow: int,
) -> dict:
    history = fetch_history(symbol, start=start, end=end)
    if history.empty:
        raise ValueError(f"No history for {symbol}")

    cerebro = bt.Cerebro()
    cerebro.addstrategy(SmaCrossover, fast_period=fast, slow_period=slow, printlog=False)
    cerebro.adddata(PandasData(dataname=history))
    cerebro.broker.setcash(cash)
    cerebro.broker.setcommission(commission=commission)
    cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name="sharpe", timeframe=bt.TimeFrame.Days)
    cerebro.addanalyzer(bt.analyzers.DrawDown, _name="drawdown")
    cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name="trades")

    start_value = cerebro.broker.getvalue()
    results = cerebro.run()
    end_value = cerebro.broker.getvalue()
    strat = results[0]

    sharpe = strat.analyzers.sharpe.get_analysis().get("sharperatio")
    drawdown = strat.analyzers.drawdown.get_analysis()
    trades = strat.analyzers.trades.get_analysis()

    return {
        "symbol": symbol,
        "start": start,
        "end": end,
        "initial_cash": cash,
        "final_value": round(end_value, 2),
        "total_return_pct": round(((end_value - start_value) / start_value) * 100, 2),
        "sharpe_ratio": round(sharpe, 4) if sharpe is not None else None,
        "max_drawdown_pct": round(drawdown.max.drawdown, 2) if drawdown else None,
        "total_trades": trades.total.closed if trades else 0,
        "won_trades": trades.won.total if trades and trades.won else 0,
    }


def main() -> None:
    config = load_watchlist()
    bt_cfg = config.get("backtest", {})

    parser = argparse.ArgumentParser(description="Run SMA crossover backtest")
    parser.add_argument("--symbol", default=bt_cfg.get("default_symbol", "AAPL"))
    parser.add_argument("--start", default=bt_cfg.get("start", "2020-01-01"))
    parser.add_argument("--end", default=bt_cfg.get("end"))
    parser.add_argument("--cash", type=float, default=float(bt_cfg.get("initial_cash", 100000)))
    parser.add_argument("--commission", type=float, default=float(bt_cfg.get("commission", 0.001)))
    parser.add_argument("--fast", type=int, default=10)
    parser.add_argument("--slow", type=int, default=30)
    parser.add_argument("--output", default="backtests/output/latest.json")
    args = parser.parse_args()

    summary = run_backtest(
        symbol=args.symbol,
        start=args.start,
        end=args.end,
        cash=args.cash,
        commission=args.commission,
        fast=args.fast,
        slow=args.slow,
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
