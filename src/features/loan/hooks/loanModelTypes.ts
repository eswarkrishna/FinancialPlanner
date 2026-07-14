import type { ScheduleRow } from "../../../lib/loan";

export type { PrepaySource, ScenarioView } from "../../../lib/loan/scenarioViews";
export { SCENARIO_ID_TO_VIEW, SCENARIO_LABELS } from "../../../lib/loan/scenarioViews";

export type ScheduleBundle = {
  rows: ScheduleRow[];
  totals: {
    payoff_month: number;
    total_interest_inr: number;
    total_paid_inr: number;
    total_prepayments_inr?: number;
  };
  cashBalances?: number[];
  warnings?: string[];
};

export type ComparisonRow = {
  id: string;
  label: string;
  payoffMonth: number;
  totalInterest: number;
  totalPaid: number;
  deltaVsBaseMonths: number;
  deltaInterestVsBase: number;
  minCashBalance?: number;
  /** Gross interest saved vs BASE (§4.4.1). */
  grossInterestSaved: number;
  /** Prepayment / foreclosure fees charged (§4.4.1). */
  prepaymentFees: number;
  /** Gross interest saved minus fees (§4.4.1). */
  netSavingsAfterFee: number;
};

/** Side-by-side Reduce EMI vs Reduce Tenure row (§4.4.2). */
export type PrepayStrategyCompareRow = {
  id: "PREPAY_EMI" | "PREPAY_TENURE";
  policyLabel: string;
  newEmi: number;
  newTenureMonths: number;
  totalInterest: number;
  grossInterestSaved: number;
  prepaymentFees: number;
  netSavingsAfterFee: number;
};
