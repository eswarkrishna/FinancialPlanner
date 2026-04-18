import {
  baselineSchedule,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
} from "../../../lib/loan";
import { computePfUnemploymentWithdrawalPlan } from "../../../lib/pf";
import {
  makeReferenceLoanInput,
  makeReferencePfInput,
  makeReferencePrepayInput,
} from "../../factories";

export type GoldenSnapshot = {
  emi_inr: number;
  totals: {
    total_paid_inr: number;
    total_interest_inr: number;
    total_prepayments_inr: number;
    payoff_month: number;
  };
  first_row: {
    month: number;
    opening_inr: number;
    interest_inr: number;
    principal_inr: number;
    prepayment_inr: number;
    closing_inr: number;
    payment_inr: number;
    emi_inr: number;
  };
  row_12: {
    month: number;
    opening_inr: number;
    interest_inr: number;
    principal_inr: number;
    prepayment_inr: number;
    closing_inr: number;
    payment_inr: number;
    emi_inr: number;
  } | null;
  last_row: {
    month: number;
    opening_inr: number;
    interest_inr: number;
    principal_inr: number;
    prepayment_inr: number;
    closing_inr: number;
    payment_inr: number;
    emi_inr: number;
  } | null;
  row_count: number;
};

export type GoldenScenarioMap = {
  BASE: GoldenSnapshot;
  PREPAY_CASH_25L_TENURE: GoldenSnapshot;
  UE_PF_TO_LOAN: GoldenSnapshot;
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

export function computeGoldenScenarios(): GoldenScenarioMap {
  const loan = makeReferenceLoanInput();
  const prepay = makeReferencePrepayInput();
  const pf = makeReferencePfInput();

  const base = baselineSchedule(
    loan.principal_inr,
    loan.annual_interest_rate,
    loan.tenure_months,
  );
  const prepayTenure = schedulePrepayKeepTenure(
    loan.principal_inr,
    loan.annual_interest_rate,
    loan.tenure_months,
    prepay.prepay_month,
    prepay.prepay_inr,
  );
  const pfPlan = computePfUnemploymentWithdrawalPlan(
    pf.pf_corpus_inr,
    pf.pf_annual_interest_rate_pct,
    pf.monthly_pf_addition_inr,
  );
  const uePfToLoan = scheduleTimedPrepaysKeepEmi(
    loan.principal_inr,
    loan.annual_interest_rate,
    loan.tenure_months,
    [
      { month: 1, amount_inr: pfPlan.tranche1_inr },
      { month: 12, amount_inr: pfPlan.tranche2_inr },
    ],
  );

  return {
    BASE: compactPayload(base),
    PREPAY_CASH_25L_TENURE: compactPayload(prepayTenure),
    UE_PF_TO_LOAN: compactPayload(uePfToLoan),
  };
}
