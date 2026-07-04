"""Market data fetching via OpenBB and yfinance."""

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from typing import Literal

import pandas as pd

Provider = Literal["openbb", "yfinance", "auto"]


def preferred_provider() -> Provider:
    value = os.getenv("DATA_PROVIDER", "auto").strip().lower()
    if value in {"openbb", "yfinance", "auto"}:
        return value  # type: ignore[return-value]
    return "auto"


def _normalize_ohlcv(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [str(level).lower() for level in df.columns.get_level_values(0)]

    rename_map = {
        "open": "Open",
        "high": "High",
        "low": "Low",
        "close": "Close",
        "adj close": "Adj Close",
        "volume": "Volume",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    required = ["Open", "High", "Low", "Close", "Volume"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"OHLCV frame missing columns: {missing}")

    df = df[required].copy()
    df.index = pd.to_datetime(df.index)
    return df.sort_index()


def fetch_yfinance(symbol: str, start: str, end: str | None = None) -> pd.DataFrame:
    import yfinance as yf

    ticker = yf.Ticker(symbol)
    history = ticker.history(start=start, end=end, auto_adjust=False)
    return _normalize_ohlcv(history)


def fetch_openbb(symbol: str, start: str, end: str | None = None) -> pd.DataFrame:
    from openbb import obb

    end_date = end or datetime.now(UTC).strftime("%Y-%m-%d")
    result = obb.equity.price.historical(
        symbol=symbol,
        start_date=start,
        end_date=end_date,
        provider="yfinance",
    )
    df = result.to_df()
    if "date" in df.columns:
        df = df.set_index("date")
    return _normalize_ohlcv(df)


def fetch_history(
    symbol: str,
    start: str,
    end: str | None = None,
    provider: Provider | None = None,
) -> pd.DataFrame:
    """Fetch daily OHLCV history for a US equity symbol."""
    chosen = provider or preferred_provider()

    if chosen == "yfinance":
        return fetch_yfinance(symbol, start, end)

    if chosen == "openbb":
        return fetch_openbb(symbol, start, end)

    try:
        return fetch_openbb(symbol, start, end)
    except Exception:
        return fetch_yfinance(symbol, start, end)


def fetch_quote(symbol: str, provider: Provider | None = None) -> dict[str, float | str]:
    """Latest price snapshot for dashboard/alerts."""
    end = datetime.now(UTC).date()
    start = end - timedelta(days=10)
    history = fetch_history(symbol, start=str(start), end=str(end), provider=provider)
    if history.empty:
        raise ValueError(f"No quote data for {symbol}")

    latest = history.iloc[-1]
    prev = history.iloc[-2] if len(history) > 1 else latest
    change_pct = ((latest["Close"] - prev["Close"]) / prev["Close"]) * 100

    return {
        "symbol": symbol,
        "price": float(latest["Close"]),
        "change_pct": float(change_pct),
        "volume": float(latest["Volume"]),
    }


def load_watchlist(path: str = "config/watchlist.yaml") -> dict:
    import yaml

    with open(path, encoding="utf-8") as handle:
        return yaml.safe_load(handle)
