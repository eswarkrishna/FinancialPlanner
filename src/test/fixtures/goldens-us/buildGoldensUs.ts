import {
  baselineSchedule,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
} from "../../../lib/loan";
import { computeK401JobLossWithdrawalPlan } from "../../../lib/k401";
import { REFERENCE_SCENARIO_US } from "../../../lib/locale/constants";
import type { GoldenSnapshot } from "../goldens/buildGoldens";

export type UsGoldenScenarioMap = {
  BASE: GoldenSnapshot;
  PREPAY_CASH_50K_TENURE: GoldenSnapshot;
  JL_401K_TO_LOAN: GoldenSnapshot;
};

function compactPayload(result: {
  emi_inr?: number;
  totals: {
    total_paid_inr: number;
    total_interest_inr: number;
    total_prepayments_inr: number;
    payoff_month: number;
  };
  rows: Array<{
    month: number;
    opening_inr: number;
    interest_inr: number;
    principal_inr: number;
    prepayment_inr: number;
    closing_inr: number;
    payment_inr: number;
    emi_inr: number;
  }>;
}): GoldenSnapshot {
  return {
    emi_inr: result.emi_inr ?? result.rows[0]?.emi_inr ?? 0,
    totals: result.totals,
    first_row: result.rows[0]!,
    row_12: result.rows[11] ?? null,
    last_row: result.rows[result.rows.length - 1] ?? null,
    row_count: result.rows.length,
  };
}

/** SPEC-US §10 / §15 — US reference golden scenarios. */
export function computeUsGoldenScenarios(): UsGoldenScenarioMap {
  const loan = REFERENCE_SCENARIO_US;
  const base = baselineSchedule(
    loan.principal_inr,
    loan.annual_interest_rate,
    loan.tenure_months,
  );
  const prepayTenure = schedulePrepayKeepTenure(
    loan.principal_inr,
    loan.annual_interest_rate,
    loan.tenure_months,
    1,
    50_000,
  );
  const k401Plan = computeK401JobLossWithdrawalPlan(
    loan.pf_corpus_inr,
    loan.vested_fraction_pct,
  );
  const jl401kToLoan = scheduleTimedPrepaysKeepEmi(
    loan.principal_inr,
    loan.annual_interest_rate,
    loan.tenure_months,
    [
      { month: 1, amount_inr: k401Plan.tranche1_gross_usd },
      { month: 12, amount_inr: k401Plan.tranche2_gross_usd },
    ],
  );

  return {
    BASE: compactPayload(base),
    PREPAY_CASH_50K_TENURE: compactPayload(prepayTenure),
    JL_401K_TO_LOAN: compactPayload(jl401kToLoan),
  };
}
