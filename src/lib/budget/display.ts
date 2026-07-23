import { roundInr } from "../money";

/** Display-only chart view for the budget tab (SPEC §4.16.5). */
export type BudgetChartView = "monthly" | "yearly";

export function chartViewFactor(view: BudgetChartView): number {
  return view === "yearly" ? 12 : 1;
}

/** Simple annualisation for charted amounts: yearly = monthly × 12, no compounding. */
export function scaleForChartView(amountInr: number, view: BudgetChartView): number {
  return roundInr(amountInr * chartViewFactor(view));
}

export function chartViewLabel(view: BudgetChartView): string {
  return view === "yearly" ? "yearly" : "monthly";
}

/** Savings-rate visual band (SPEC §4.16.5): red < 10%, amber 10–20%, green ≥ 20%. */
export type SavingsRateBand = "low" | "medium" | "high";

export function savingsRateBand(pct: number): SavingsRateBand {
  if (pct >= 20) return "high";
  if (pct >= 10) return "medium";
  return "low";
}

export function savingsRateBandTone(
  band: SavingsRateBand,
): "danger" | "warning" | "positive" {
  if (band === "high") return "positive";
  if (band === "medium") return "warning";
  return "danger";
}
