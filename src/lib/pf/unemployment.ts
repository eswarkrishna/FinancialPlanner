import { roundInr } from "../money";
import { DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT } from "./constants";

export { DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT } from "./constants";

export interface PfWithdrawalPlan {
  tranche1_inr: number;
  tranche2_inr: number;
  total_withdrawn_inr: number;
}

/**
 * SPEC §4.7 canonical PF withdrawal math:
 * - Month 1 tranche withdraws 75% of PF0.
 * - Remaining 25% receives monthly PF additions for 12 months, then annual PF interest once before month 12 tranche.
 */
export function computePfUnemploymentWithdrawalPlan(
  pfCorpusInr: number,
  annualInterestRatePct = DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT,
  monthlyPfAdditionInr = 0,
): PfWithdrawalPlan {
  const safePf = Math.max(0, pfCorpusInr);
  const safeRate = Math.max(0, annualInterestRatePct);
  const safeMonthlyPfAddition = Math.max(0, monthlyPfAdditionInr);
  const tranche1 = roundInr(safePf * 0.75);
  const remainingAfterTranche1 = roundInr(safePf - tranche1);
  const afterMonthlyAdditions = roundInr(
    remainingAfterTranche1 + safeMonthlyPfAddition * 12,
  );
  const tranche2 = roundInr(afterMonthlyAdditions * (1 + safeRate / 100));
  return {
    tranche1_inr: tranche1,
    tranche2_inr: tranche2,
    total_withdrawn_inr: roundInr(tranche1 + tranche2),
  };
}
