from __future__ import annotations

from unittest.mock import patch

import pandas as pd

from data.fetch import _normalize_ohlcv


def test_normalize_ohlcv_lowercase_columns():
    df = pd.DataFrame(
        {
            "open": [1.0, 2.0],
            "high": [1.1, 2.1],
            "low": [0.9, 1.9],
            "close": [1.0, 2.0],
            "volume": [100, 200],
        },
        index=pd.to_datetime(["2024-01-01", "2024-01-02"]),
    )
    normalized = _normalize_ohlcv(df)
    assert list(normalized.columns) == ["Open", "High", "Low", "Close", "Volume"]


@patch("data.fetch.fetch_yfinance")
def test_fetch_history_prefers_openbb_then_falls_back(mock_yf):
    from data.fetch import fetch_history

    dates = pd.date_range("2024-01-01", periods=5, freq="D")
    frame = pd.DataFrame(
        {
            "Open": [1, 2, 3, 4, 5],
            "High": [1, 2, 3, 4, 5],
            "Low": [1, 2, 3, 4, 5],
            "Close": [1, 2, 3, 4, 5],
            "Volume": [10, 10, 10, 10, 10],
        },
        index=dates,
    )
    mock_yf.return_value = frame

    result = fetch_history("AAPL", start="2024-01-01", end="2024-01-05", provider="yfinance")
    assert len(result) == 5
    mock_yf.assert_called_once()
