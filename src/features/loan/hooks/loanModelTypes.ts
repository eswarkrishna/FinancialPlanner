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
};
