"""Daily US equity scan and alert delivery."""

from __future__ import annotations

import argparse
import json
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from dotenv import load_dotenv

from data.fetch import fetch_history, load_watchlist

load_dotenv()


def compute_rsi(close: pd.Series, period: int = 14) -> float:
    if len(close) < period + 1:
        return float("nan")

    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(period).mean()
    avg_loss = loss.rolling(period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return float(rsi.iloc[-1])


def scan_symbol(symbol: str, history_days: int, alert_cfg: dict) -> dict:
    end = datetime.now(UTC).date()
    start = end - timedelta(days=history_days + 30)
    history = fetch_history(symbol, start=str(start), end=str(end))

    if history.empty or len(history) < 20:
        return {"symbol": symbol, "status": "insufficient_data"}

    latest = history.iloc[-1]
    prev = history.iloc[-2]
    change_pct = ((latest["Close"] - prev["Close"]) / prev["Close"]) * 100
    rsi = compute_rsi(history["Close"])

    alerts: list[str] = []
    if not np.isnan(rsi) and rsi <= alert_cfg.get("rsi_oversold", 30):
        alerts.append(f"RSI oversold ({rsi:.1f})")
    if not np.isnan(rsi) and rsi >= alert_cfg.get("rsi_overbought", 70):
        alerts.append(f"RSI overbought ({rsi:.1f})")
    if abs(change_pct) >= alert_cfg.get("min_daily_change_pct", 3.0):
        direction = "up" if change_pct > 0 else "down"
        alerts.append(f"Large move {direction} ({change_pct:+.2f}%)")

    return {
        "symbol": symbol,
        "price": round(float(latest["Close"]), 2),
        "change_pct": round(float(change_pct), 2),
        "rsi_14": round(rsi, 2) if not np.isnan(rsi) else None,
        "alerts": alerts,
        "status": "ok",
    }


def run_scan(config_path: str = "config/watchlist.yaml") -> dict:
    config = load_watchlist(config_path)
    alert_cfg = config.get("alerts", {})
    history_days = int(alert_cfg.get("history_days", 120))

    rows = [
        scan_symbol(symbol, history_days=history_days, alert_cfg=alert_cfg)
        for symbol in config.get("symbols", [])
    ]

    triggered = [row for row in rows if row.get("alerts")]
    return {
        "generated_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "market": config.get("market", "US"),
        "watchlist_size": len(rows),
        "triggered_count": len(triggered),
        "rows": rows,
        "triggered": triggered,
    }


def format_message(report: dict) -> str:
    lines = [
        f"US Equity Daily Scan ({report['generated_at']})",
        f"Triggered: {report['triggered_count']} / {report['watchlist_size']}",
        "",
    ]
    for row in report.get("triggered", []):
        alerts = ", ".join(row.get("alerts", []))
        lines.append(
            f"- {row['symbol']}: ${row['price']} ({row['change_pct']:+.2f}%), "
            f"RSI={row.get('rsi_14')} → {alerts}"
        )
    if not report.get("triggered"):
        lines.append("No alert thresholds breached today.")
    return "\n".join(lines)


def send_discord(message: str) -> None:
    webhook = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook:
        return
    requests.post(webhook, json={"content": message[:1900]}, timeout=15).raise_for_status()


def send_telegram(message: str) -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    requests.post(url, json={"chat_id": chat_id, "text": message[:3900]}, timeout=15).raise_for_status()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run daily US equity alert scan")
    parser.add_argument("--config", default="config/watchlist.yaml")
    parser.add_argument("--output", default="alerts/output/latest.json")
    parser.add_argument("--notify", action="store_true", help="Send Discord/Telegram if configured")
    args = parser.parse_args()

    report = run_scan(args.config)
    message = format_message(report)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(message)
    if args.notify:
        send_discord(message)
        send_telegram(message)


if __name__ == "__main__":
    main()
