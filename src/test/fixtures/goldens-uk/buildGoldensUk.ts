import { baselineSchedule, schedulePrepayKeepTenure, simulateJlRedundancyToLoan } from "../../../lib/loan";
import { REFERENCE_SCENARIO_UK } from "../../../lib/locale/constants";
import { ukCashflowBaseInput } from "../../../features/loan/hooks/loanModelHelpers";
import type { GoldenSnapshot } from "../goldens/buildGoldens";

export type UkGoldenScenarioMap = {
  BASE: GoldenSnapshot;
  PREPAY_CASH_25K_TENURE: GoldenSnapshot;
  JL_REDUNDANCY_TO_LOAN: GoldenSnapshot;
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

/** SPEC-UK §10 / §15 — UK reference golden scenarios. */
export function computeUkGoldenScenarios(): UkGoldenScenarioMap {
  const loan = REFERENCE_SCENARIO_UK;
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
    25_000,
  );
  const jl = simulateJlRedundancyToLoan(ukCashflowBaseInput(loan, 0));

  return {
    BASE: compactPayload(base),
    PREPAY_CASH_25K_TENURE: compactPayload(prepayTenure),
    JL_REDUNDANCY_TO_LOAN: compactPayload(jl),
  };
}
