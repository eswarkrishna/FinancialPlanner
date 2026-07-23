import type { ScheduleRow } from "./amortisation";
import type { DebtMonthRow } from "../debt/simulatePayoff";
import type { RetirementYearRow } from "../retirement/project";
import type { RetirementDisplayMode } from "../retirement/display";
import { yearlyCorpusForMode } from "../retirement/display";

export interface ChartPoint {
  month: number;
  value_inr: number;
}

/** Remaining principal curve (SPEC §4.9 charts). */
export function buildPrincipalCurve(rows: ScheduleRow[]): ChartPoint[] {
  return rows.map((row) => ({
    month: row.month,
    value_inr: row.closing_inr,
  }));
}

/** Cumulative interest paid over time (SPEC §4.9 charts). */
export function buildCumulativeInterestCurve(rows: ScheduleRow[]): ChartPoint[] {
  let cumulative = 0;
  return rows.map((row) => {
    cumulative += row.interest_inr;
    return { month: row.month, value_inr: cumulative };
  });
}

/** Total debt balance over payoff timeline (§4.10). */
export function buildDebtBalanceCurve(rows: DebtMonthRow[]): ChartPoint[] {
  return rows.map((row) => ({
    month: row.month,
    value_inr: row.closing_total_inr,
  }));
}

/** Nominal retirement corpus by year (§4.11); `month` holds year index. */
export function buildBudgetPortfolioCurve(
  rows: { month: number; total_value_inr: number }[],
): ChartPoint[] {
  return rows.map((row) => ({
    month: row.month,
    value_inr: row.total_value_inr,
  }));
}

export function buildRetirementCorpusCurve(
  rows: RetirementYearRow[],
  mode: RetirementDisplayMode = "nominal",
): ChartPoint[] {
  return rows.map((row) => ({
    month: row.year,
    value_inr: yearlyCorpusForMode(row, mode),
  }));
}
