"""Simple SMA crossover strategy for backtrader."""

from __future__ import annotations

import backtrader as bt


class SmaCrossover(bt.Strategy):
    params = (
        ("fast_period", 10),
        ("slow_period", 30),
        ("printlog", False),
    )

    def __init__(self) -> None:
        self.fast = bt.indicators.SMA(self.data.close, period=self.p.fast_period)
        self.slow = bt.indicators.SMA(self.data.close, period=self.p.slow_period)
        self.crossover = bt.indicators.CrossOver(self.fast, self.slow)
        self.order = None

    def log(self, txt: str) -> None:
        if self.p.printlog:
            date = self.datas[0].datetime.date(0)
            print(f"{date.isoformat()} {txt}")

    def notify_order(self, order: bt.Order) -> None:
        if order.status in [order.Submitted, order.Accepted]:
            return
        if order.status == order.Completed:
            action = "BUY" if order.isbuy() else "SELL"
            self.log(f"{action} @ {order.executed.price:.2f}")
        self.order = None

    def next(self) -> None:
        if self.order:
            return

        if not self.position and self.crossover > 0:
            self.order = self.buy()
        elif self.position and self.crossover < 0:
            self.order = self.sell()

    def stop(self) -> None:
        self.log(
            f"Ending value {self.broker.getvalue():.2f} "
            f"(fast={self.p.fast_period}, slow={self.p.slow_period})"
        )
