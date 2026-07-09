import { describe, expect, it } from "vitest";
import { makeStrategyInputForTierUk } from "../../test/factories/strategyFactory";
import { simulateStrategyUk } from "./simulateUk";

describe("simulateStrategyUk (SPEC-UK §4.12)", () => {
  it("equity blend routes lump to ISA-first sleeve and prepay via UK cashflow", () => {
    const result = simulateStrategyUk(
      "STRATEGY_EQUITY_BLEND",
      makeStrategyInputForTierUk("tier_a"),
    );
    expect(result.one_time_prepay_inr).toBeGreaterThan(0);
    expect(result.equity_lump_inr).toBeGreaterThan(0);
    expect(result.loan_close_month).toBeGreaterThan(0);
    expect(result.interest_saved_vs_base_inr).toBeGreaterThan(0);
  });

  it("prepay heavy has zero equity corpus", () => {
    const result = simulateStrategyUk(
      "STRATEGY_PREPAY_HEAVY",
      makeStrategyInputForTierUk("tier_b"),
    );
    expect(result.equity_corpus_at_horizon_inr).toBe(0);
    expect(result.monthly_sip_inr).toBe(0);
  });

  it("charges ERC fees when prepay exceeds allowance and erc_pct is set", () => {
    const result = simulateStrategyUk(
      "STRATEGY_PREPAY_HEAVY",
      makeStrategyInputForTierUk("tier_a", {
        cash_inr: 80_000,
        erc_pct: 2,
        erc_overpayment_allowance_pct: 1,
        emergency_months_buffer: 0,
      }),
    );
    expect(result.erc_fees_inr).toBeGreaterThan(0);
  });

  it("warns ERC_ALLOWANCE_EXCEEDED when erc_pct is zero but prepay exceeds allowance", () => {
    const result = simulateStrategyUk(
      "STRATEGY_PREPAY_HEAVY",
      makeStrategyInputForTierUk("tier_a", {
        cash_inr: 80_000,
        erc_pct: 0,
        erc_overpayment_allowance_pct: 1,
        emergency_months_buffer: 0,
      }),
    );
    expect(result.warnings).toContain("ERC_ALLOWANCE_EXCEEDED");
  });
});
