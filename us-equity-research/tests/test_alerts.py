from __future__ import annotations

from unittest.mock import patch

import pandas as pd

from alerts.daily_scan import compute_rsi, format_message, run_scan


def test_compute_rsi_bounds():
    close = pd.Series([100, 102, 101, 103, 102, 104, 103, 105, 104, 106, 105, 107, 106, 108, 107, 109])
    rsi = compute_rsi(close, period=14)
    assert not pd.isna(rsi)
    assert 0 <= rsi <= 100


def test_format_message_empty_triggers():
    report = {
        "generated_at": "2026-07-04T00:00:00Z",
        "watchlist_size": 2,
        "triggered_count": 0,
        "triggered": [],
    }
    message = format_message(report)
    assert "No alert thresholds breached" in message


@patch("alerts.daily_scan.fetch_history")
def test_run_scan_with_mock_history(mock_fetch):
    dates = pd.date_range("2025-01-01", periods=60, freq="D")
    frame = pd.DataFrame(
        {
            "Open": range(100, 160),
            "High": range(101, 161),
            "Low": range(99, 159),
            "Close": range(100, 160),
            "Volume": [1_000_000] * 60,
        },
        index=dates,
    )
    mock_fetch.return_value = frame

    report = run_scan("config/watchlist.yaml")
    assert report["watchlist_size"] == len(report["rows"])
    assert report["market"] == "US"
