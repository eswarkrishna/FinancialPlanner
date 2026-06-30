import type { ScheduleRow } from "./amortisation";

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
