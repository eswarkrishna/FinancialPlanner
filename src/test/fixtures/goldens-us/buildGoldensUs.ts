import {
  baselineSchedule,
  schedulePrepayKeepTenure,
  simulateUs401kTranchesToLoanCashflow,
} from "../../../lib/loan";
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
  const jl401kToLoan = simulateUs401kTranchesToLoanCashflow({
    principal_inr: loan.principal_inr,
    annual_interest_rate: loan.annual_interest_rate,
    tenure_months: loan.tenure_months,
    cash_inr: loan.cash_inr,
    monthly_income_inr: loan.monthly_income_inr,
    monthly_living_expense_inr: loan.monthly_living_expense_inr,
    monthly_extra_to_loan_inr: 0,
    monthly_uib_inr: loan.monthly_uib_inr,
    job_loss_start_month: loan.unemployment_start_month,
    k401_balance_inr: loan.pf_corpus_inr,
    vested_fraction_pct: loan.vested_fraction_pct,
    early_withdrawal_tax_withholding_pct: loan.early_withdrawal_tax_withholding_pct,
  });

  return {
    BASE: compactPayload(base),
    PREPAY_CASH_50K_TENURE: compactPayload(prepayTenure),
    JL_401K_TO_LOAN: compactPayload(jl401kToLoan),
  };
}
