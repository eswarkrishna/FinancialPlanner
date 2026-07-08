import { REFERENCE_SCENARIO_US } from "../../lib/locale/constants";
import type { GameInput } from "../../lib/game/gameInput";
import { REFERENCE_SCENARIO } from "../../lib/loanInputSchema";

export function makeReferenceGameInput(
  overrides: Partial<GameInput> = {},
): GameInput {
  return {
    ...REFERENCE_SCENARIO,
    game_profile_id: "GAME_BL_SIM_FEE",
    payoff_metric: "INTEREST_SAVED_MINUS_FEES",
    lender_objective: "L_FEE_INCOME",
    cooperative: false,
    prepayment_fee_inr: 25_000,
    prepayment_fee_pct: 1,
    monthly_take_home_inr: 200_000,
    monthly_living_expense_inr: 80_000,
    emergency_months_buffer: 6,
    expected_equity_return_pct: 11,
    pf_annual_interest_rate_pct: 8.25,
    monthly_pf_addition_inr: 0,
    extra_monthly_income_inr: 0,
    extra_income_post_tax: true,
    marginal_tax_rate_pct: 0,
    repayment_pct_of_take_home: 80,
    w_b: 0.5,
    w_h: 0.5,
    lender_rate_bump_bps: 50,
    horizon_months: REFERENCE_SCENARIO.tenure_months,
    ...overrides,
  };
}

/** SPEC-US §15 — US reference loan + household for game goldens. */
export function makeReferenceGameInputUs(
  overrides: Partial<GameInput> = {},
): GameInput {
  return {
    ...REFERENCE_SCENARIO_US,
    game_profile_id: "GAME_BL_SIM_FEE",
    payoff_metric: "INTEREST_SAVED_MINUS_FEES",
    lender_objective: "L_FEE_INCOME",
    cooperative: false,
    prepayment_fee_inr: 500,
    prepayment_fee_pct: 1,
    monthly_take_home_inr: 12_000,
    monthly_living_expense_inr: 4_000,
    emergency_months_buffer: 6,
    expected_equity_return_pct: 11,
    pf_annual_interest_rate_pct: REFERENCE_SCENARIO_US.pf_annual_interest_rate_pct,
    monthly_pf_addition_inr: REFERENCE_SCENARIO_US.monthly_pf_addition_inr,
    extra_monthly_income_inr: 0,
    extra_income_post_tax: true,
    marginal_tax_rate_pct: 0,
    repayment_pct_of_take_home: 80,
    w_b: 0.5,
    w_h: 0.5,
    lender_rate_bump_bps: 50,
    horizon_months: REFERENCE_SCENARIO_US.tenure_months,
    ...overrides,
  };
}
