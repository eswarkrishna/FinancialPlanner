import type { StrategyInputs } from "../../lib/strategy/types";

/** Spec §15.1 — common loan + assets shared across the three reference tiers. */
const REFERENCE_LOAN_BASE = {
  principal_inr: 3_600_000,
  annual_interest_rate: 7.9,
  tenure_months: 98,
  cash_inr: 2_000_000,
  pf_corpus_inr: 2_620_000,
  pf_annual_interest_rate_pct: 8.25,
  monthly_pf_addition_inr: 0,
  extra_monthly_income_inr: 17_000,
  extra_income_post_tax: true,
  marginal_tax_rate_pct: 0,
  expected_equity_return_pct: 11,
  horizon_months: 98,
} as const;

export type ReferenceTier = "tier_a" | "tier_b" | "tier_c";

const TIER_OVERRIDES: Record<
  ReferenceTier,
  Pick<
    StrategyInputs,
    | "monthly_take_home_inr"
    | "monthly_living_expense_inr"
    | "emergency_months_buffer"
    | "repayment_pct_of_take_home"
  >
> = {
  tier_a: {
    monthly_take_home_inr: 300_000,
    monthly_living_expense_inr: 80_000,
    emergency_months_buffer: 6,
    repayment_pct_of_take_home: 90,
  },
  tier_b: {
    monthly_take_home_inr: 200_000,
    monthly_living_expense_inr: 80_000,
    emergency_months_buffer: 8,
    repayment_pct_of_take_home: 80,
  },
  tier_c: {
    monthly_take_home_inr: 100_000,
    monthly_living_expense_inr: 50_000,
    emergency_months_buffer: 12,
    repayment_pct_of_take_home: 75,
  },
};

export function makeStrategyInputForTier(
  tier: ReferenceTier,
  overrides: Partial<StrategyInputs> = {},
): StrategyInputs {
  return {
    ...REFERENCE_LOAN_BASE,
    ...TIER_OVERRIDES[tier],
    ...overrides,
  };
}

export const REFERENCE_TIERS: readonly ReferenceTier[] = [
  "tier_a",
  "tier_b",
  "tier_c",
];
