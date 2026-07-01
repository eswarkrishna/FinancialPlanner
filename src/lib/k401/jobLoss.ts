import { roundUsd } from "../money";
import {
  DEFAULT_EARLY_WITHDRAWAL_PENALTY_PCT,
  DEFAULT_EARLY_WITHDRAWAL_TAX_WITHHOLDING_PCT,
  K401_TRANCHE_FRACTION,
} from "./constants";

export interface K401WithdrawalPlan {
  tranche1_gross_usd: number;
  tranche2_gross_usd: number;
  total_gross_usd: number;
  vested_balance_usd: number;
}

export interface EarlyWithdrawalCost {
  gross_usd: number;
  penalty_usd: number;
  withholding_usd: number;
  net_to_cash_usd: number;
}

/**
 * SPEC-US §4.7 — 50% + 50% of vested balance at job-loss start.
 */
export function computeK401JobLossWithdrawalPlan(
  k401BalanceUsd: number,
  vestedFractionPct = 100,
): K401WithdrawalPlan {
  const vested = roundUsd(
    Math.max(0, k401BalanceUsd) * (Math.max(0, Math.min(100, vestedFractionPct)) / 100),
  );
  const tranche1 = roundUsd(vested * K401_TRANCHE_FRACTION);
  const tranche2 = roundUsd(vested - tranche1);
  return {
    vested_balance_usd: vested,
    tranche1_gross_usd: tranche1,
    tranche2_gross_usd: tranche2,
    total_gross_usd: roundUsd(tranche1 + tranche2),
  };
}

/** SPEC-US §4.7 / §7.4 — penalty + withholding on cash-bound gross. */
export function computeEarlyWithdrawalCost(
  grossUsd: number,
  withholdingPct = DEFAULT_EARLY_WITHDRAWAL_TAX_WITHHOLDING_PCT,
  penaltyPct = DEFAULT_EARLY_WITHDRAWAL_PENALTY_PCT,
): EarlyWithdrawalCost {
  const gross = roundUsd(Math.max(0, grossUsd));
  const penalty = roundUsd(gross * (penaltyPct / 100));
  const withholding = roundUsd(gross * (withholdingPct / 100));
  return {
    gross_usd: gross,
    penalty_usd: penalty,
    withholding_usd: withholding,
    net_to_cash_usd: roundUsd(gross - penalty - withholding),
  };
}

export interface EmployerMatchInput {
  annual_salary_usd: number;
  monthly_401k_deferral_usd: number;
  employer_match_rate_pct: number;
  employer_match_cap_pct_of_salary: number;
  monthly_employer_match_usd_override?: number;
}

/** SPEC-US §4.2 employer match formula. */
export function computeMonthlyEmployerMatchUsd(input: EmployerMatchInput): number {
  if (
    input.monthly_employer_match_usd_override !== undefined &&
    input.monthly_employer_match_usd_override >= 0
  ) {
    return roundUsd(input.monthly_employer_match_usd_override);
  }
  const capMonthly = roundUsd(
    (Math.max(0, input.annual_salary_usd) *
      Math.max(0, input.employer_match_cap_pct_of_salary)) /
      100 /
      12,
  );
  const eligible = Math.min(
    Math.max(0, input.monthly_401k_deferral_usd),
    capMonthly,
  );
  return roundUsd(eligible * (Math.max(0, input.employer_match_rate_pct) / 100));
}
