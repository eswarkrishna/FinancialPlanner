import { describe, expect, it } from "vitest";
import { simulateDebtPayoff } from "./debtPlanner";

const debtsFixture = [
  {
    id: "card",
    name: "Credit Card",
    balance_inr: 150_000,
    apr_pct: 36,
    minimum_payment_inr: 8_000,
  },
  {
    id: "pl",
    name: "Personal Loan",
    balance_inr: 450_000,
    apr_pct: 16,
    minimum_payment_inr: 12_000,
  },
  {
    id: "consumer",
    name: "Consumer Durable",
    balance_inr: 80_000,
    apr_pct: 14,
    minimum_payment_inr: 4_000,
  },
];

describe("simulateDebtPayoff", () => {
  it("keeps avalanche interest less than or equal to snowball interest", () => {
    const avalanche = simulateDebtPayoff(
      debtsFixture,
      40_000,
      "2026-04-01",
      "avalanche",
    );
    const snowball = simulateDebtPayoff(
      debtsFixture,
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
    const avalanche = simulateDebtPayoff(
      debtsFixture,
      40_000,
      "2026-01-15",
      "avalanche",
    );
    expect(avalanche.summary.payoff_months).toBeGreaterThan(0);
    expect(avalanche.summary.payoff_date_iso).toBeTruthy();
    expect(avalanche.summary.payoff_date_iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("warns when monthly budget is lower than minimum dues", () => {
    const result = simulateDebtPayoff(
      debtsFixture,
      10_000,
      "2026-04-01",
      "snowball",
    );
    expect(result.summary.is_paid_off).toBe(false);
    expect(result.rows.length).toBe(0);
    expect(result.warning).toMatch(/below total minimum payments/i);
  });
});
