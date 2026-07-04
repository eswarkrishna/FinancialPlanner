"""Streamlit dashboard — Bloomberg-style watchlist and charts."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from data.fetch import fetch_history, load_watchlist

st.set_page_config(page_title="US Equity Research", layout="wide")
st.title("US Equity Research Desk")
st.caption("OpenBB/yfinance data · daily watchlist · research dashboard")

config = load_watchlist()
symbols = config.get("symbols", [])
alert_cfg = config.get("alerts", {})

col_left, col_right = st.columns([1, 2])

with col_left:
    st.subheader("Watchlist")
    selected = st.selectbox("Symbol", symbols, index=0)
    days = st.slider("Chart lookback (days)", min_value=30, max_value=365, value=180)

with col_right:
    st.subheader("Market snapshot")
    end = datetime.now(UTC).date()
    start = end - timedelta(days=alert_cfg.get("history_days", 120) + 30)

    snapshot_rows = []
    progress = st.progress(0.0, text="Loading quotes...")
    for idx, symbol in enumerate(symbols):
        try:
            history = fetch_history(symbol, start=str(start), end=str(end))
            if history.empty:
                continue
            latest = history.iloc[-1]
            prev = history.iloc[-2] if len(history) > 1 else latest
            change_pct = ((latest["Close"] - prev["Close"]) / prev["Close"]) * 100
            snapshot_rows.append(
                {
                    "Symbol": symbol,
                    "Price": round(float(latest["Close"]), 2),
                    "Change %": round(float(change_pct), 2),
                    "Volume": int(latest["Volume"]),
                }
            )
        except Exception as exc:  # noqa: BLE001
            snapshot_rows.append({"Symbol": symbol, "Price": None, "Change %": None, "Volume": str(exc)})
        progress.progress((idx + 1) / len(symbols), text=f"Loaded {symbol}")

    progress.empty()
    st.dataframe(pd.DataFrame(snapshot_rows), use_container_width=True, hide_index=True)

st.subheader(f"{selected} — price chart")
chart_start = end - timedelta(days=days)
history = fetch_history(selected, start=str(chart_start), end=str(end))

if history.empty:
    st.warning(f"No data available for {selected}")
else:
    fig = go.Figure()
    fig.add_trace(
        go.Candlestick(
            x=history.index,
            open=history["Open"],
            high=history["High"],
            low=history["Low"],
            close=history["Close"],
            name=selected,
        )
    )
    fig.update_layout(
        xaxis_rangeslider_visible=False,
        height=500,
        margin=dict(l=20, r=20, t=30, b=20),
        template="plotly_dark",
    )
    st.plotly_chart(fig, use_container_width=True)

st.info(
    "Disclaimer: For research and education only. Not investment advice. "
    "Verify data with your broker before trading."
)
