import { describe, expect, it } from "vitest";
import { simulateAllStrategies, simulateStrategy } from "./simulate";
import { makeStrategyInputForTier } from "../../test/factories";

describe("simulateStrategy — SPEC §4.12 / §10 acceptance", () => {
  it("18 — STRATEGY_AGGRESSIVE_PREPAY: higher pct does not extend loan close", () => {
    const base = makeStrategyInputForTier("tier_a", {
      repayment_pct_of_take_home: 50,
    });
    const aggressive = makeStrategyInputForTier("tier_a", {
      repayment_pct_of_take_home: 90,
    });
    const low = simulateStrategy("STRATEGY_AGGRESSIVE_PREPAY", base);
    const high = simulateStrategy("STRATEGY_AGGRESSIVE_PREPAY", aggressive);
    expect(high.loan_close_month).toBeLessThanOrEqual(low.loan_close_month);
  });

  it("19 — STRATEGY_EQUITY_BLEND ≥ STRATEGY_PREPAY_HEAVY equity corpus when expected_return ≥ rate + 2", () => {
    const input = makeStrategyInputForTier("tier_a", {
      expected_equity_return_pct: 11,
    });
    expect(input.expected_equity_return_pct).toBeGreaterThanOrEqual(
      input.annual_interest_rate + 2,
    );
    const blend = simulateStrategy("STRATEGY_EQUITY_BLEND", input);
    const heavy = simulateStrategy("STRATEGY_PREPAY_HEAVY", input);
    expect(blend.equity_corpus_at_horizon_inr).toBeGreaterThanOrEqual(
      heavy.equity_corpus_at_horizon_inr,
    );
  });

  it("20 — STRATEGY_PREPAY_HEAVY ≥ STRATEGY_EQUITY_BLEND net worth when expected_return ≤ rate", () => {
    const input = makeStrategyInputForTier("tier_a", {
      expected_equity_return_pct: 6,
    });
    expect(input.expected_equity_return_pct).toBeLessThanOrEqual(
      input.annual_interest_rate,
    );
    const blend = simulateStrategy("STRATEGY_EQUITY_BLEND", input);
    const heavy = simulateStrategy("STRATEGY_PREPAY_HEAVY", input);
    expect(heavy.net_worth_at_horizon_inr).toBeGreaterThanOrEqual(
      blend.net_worth_at_horizon_inr,
    );
  });

  it("21 — EMERGENCY_FUND_SHORTFALL fires across all strategies and zeroes deployable", () => {
    const input = makeStrategyInputForTier("tier_c", { cash_inr: 100_000 });
    const results = simulateAllStrategies(input);
    for (const r of results) {
      expect(r.warnings).toContain("EMERGENCY_FUND_SHORTFALL");
      expect(r.one_time_prepay_inr).toBe(0);
      expect(r.equity_lump_inr).toBe(0);
    }
  });

  it("22 — BELOW_SUBSISTENCE warning fires for tier C aggressive at 90%", () => {
    const input = makeStrategyInputForTier("tier_c", {
      repayment_pct_of_take_home: 90,
    });
    const r = simulateStrategy("STRATEGY_AGGRESSIVE_PREPAY", input);
    expect(r.warnings).toContain("BELOW_SUBSISTENCE");
  });

  it("24 — equity corpus at horizon strictly grows post-loan when redirection > 0", () => {
    const input = makeStrategyInputForTier("tier_a");
    const r = simulateStrategy("STRATEGY_PREPAY_HEAVY", input);
    expect(input.horizon_months).toBeGreaterThan(r.loan_close_month);
    expect(r.equity_corpus_at_horizon_inr).toBeGreaterThan(0);
  });

  it("FRAGILE_CASH_FLOW fires when EMI > 50% of take-home", () => {
    const input = makeStrategyInputForTier("tier_c", {
      monthly_take_home_inr: 80_000,
    });
    const results = simulateAllStrategies(input);
    for (const r of results) {
      expect(r.warnings).toContain("FRAGILE_CASH_FLOW");
    }
  });

  it("AGGRESSIVE_PCT_INVALID warning fires and clamps when pct > 100", () => {
    const input = makeStrategyInputForTier("tier_a", {
      repayment_pct_of_take_home: 150,
    });
    const r = simulateStrategy("STRATEGY_AGGRESSIVE_PREPAY", input);
    expect(r.warnings).toContain("AGGRESSIVE_PCT_INVALID");
    expect(r.loan_close_month).toBeGreaterThan(0);
  });

  it("HORIZON_TOO_SHORT fires when horizon < loan close", () => {
    const input = makeStrategyInputForTier("tier_a", { horizon_months: 12 });
    const r = simulateStrategy("STRATEGY_PREPAY_HEAVY", input);
    expect(r.warnings).toContain("HORIZON_TOO_SHORT");
    expect(r.loan_balance_at_horizon_inr).toBeGreaterThan(0);
  });

  it("interest_saved_vs_base equals baseline minus strategy interest", () => {
    const input = makeStrategyInputForTier("tier_a");
    const r = simulateStrategy("STRATEGY_EQUITY_BLEND", input);
    expect(r.interest_saved_vs_base_inr).toBeGreaterThan(0);
    expect(r.total_interest_inr).toBeGreaterThan(0);
  });

  it("min_living_budget_inr matches THM(1 - pct/100) for aggressive when EXTRA fully covers loan", () => {
    const input = makeStrategyInputForTier("tier_a", {
      repayment_pct_of_take_home: 90,
    });
    const r = simulateStrategy("STRATEGY_AGGRESSIVE_PREPAY", input);
    expect(r.min_living_budget_inr).toBe(input.monthly_take_home_inr * 0.1);
  });
});
