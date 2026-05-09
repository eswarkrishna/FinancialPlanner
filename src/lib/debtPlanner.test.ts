import { describe, expect, it } from "vitest";
import { simulateDebtPayoff } from "./debt";
import { makeReferenceDebts } from "../test/factories";

describe("simulateDebtPayoff", () => {
  it("keeps avalanche interest less than or equal to snowball interest", () => {
    const debts = makeReferenceDebts();
    const avalanche = simulateDebtPayoff(
      debts,
      40_000,
      "2026-04-01",
      "avalanche",
    );
    const snowball = simulateDebtPayoff(
      debts,
      40_000,
      "2026-04-01",
      "snowball",
    );

    expect(avalanche.summary.is_paid_off).toBe(true);
    expect(snowball.summary.is_paid_off).toBe(true);
    expect(avalanche.summary.total_interest_inr).toBeLessThanOrEqual(
      snowball.summary.total_interest_inr,
    );
  });

  it("projects payoff date from start date and payoff month", () => {
    const debts = makeReferenceDebts();
    const avalanche = simulateDebtPayoff(
      debts,
      40_000,
      "2026-01-15",
      "avalanche",
    );
    expect(avalanche.summary.payoff_months).toBeGreaterThan(0);
    expect(avalanche.summary.payoff_date_iso).toBeTruthy();
    expect(avalanche.summary.payoff_date_iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("warns when monthly budget is lower than minimum dues", () => {
    const debts = makeReferenceDebts();
    const result = simulateDebtPayoff(
      debts,
      10_000,
      "2026-04-01",
      "snowball",
    );
    expect(result.summary.is_paid_off).toBe(false);
    expect(result.rows.length).toBe(0);
    expect(result.warning).toMatch(/below total minimum payments/i);
  });

  it("keeps summary totals finite when APR is wildly mis-entered", () => {
    const debts = [
      {
        id: "bad-apr",
        name: "Mis-keyed row",
        balance_inr: 36,
        apr_pct: 8000,
        minimum_payment_inr: 8000,
      },
    ];
    const result = simulateDebtPayoff(debts, 100_000, "2026-04-01", "avalanche");
    expect(Number.isFinite(result.summary.total_interest_inr)).toBe(true);
    expect(Number.isFinite(result.summary.total_paid_inr)).toBe(true);
  });
});
