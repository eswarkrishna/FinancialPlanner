import { roundInr } from "../money";
import { DEFAULT_SAFE_WITHDRAWAL_RATE_PCT } from "./constants";
import type { RetirementProjection, RetirementYearRow } from "./project";

/** Corpus display toggle (§4.11.3). */
export type RetirementDisplayMode = "nominal" | "real";

export const RETIREMENT_DISPLAY_MODES: RetirementDisplayMode[] = ["nominal", "real"];

export function isRetirementDisplayMode(value: string): value is RetirementDisplayMode {
  return value === "nominal" || value === "real";
}

export function inflationFactor(annualInflationPct: number, years: number): number {
  return (1 + Math.max(0, annualInflationPct) / 100) ** years;
}

/** Deflate a future amount to today's purchasing power (§4.11.3). */
export function deflateToToday(
  value: number,
  annualInflationPct: number,
  yearsFromToday: number,
): number {
  if (yearsFromToday <= 0) {
    return roundInr(value);
  }
  return roundInr(value / inflationFactor(annualInflationPct, yearsFromToday));
}

export function corpusSeriesLabel(mode: RetirementDisplayMode): string {
  return mode === "real" ? "Real (today's value)" : "Nominal";
}

export function projectedCorpusForMode(
  projection: RetirementProjection,
  mode: RetirementDisplayMode,
): number {
  return mode === "real"
    ? projection.projected_real_corpus_inr
    : projection.projected_corpus_inr;
}

export function yearlyCorpusForMode(
  row: RetirementYearRow,
  mode: RetirementDisplayMode,
): number {
  return mode === "real" ? row.corpus_real_inr : row.corpus_nominal_inr;
}

export function realTargetCorpus(
  annualExpenseTodayInr: number,
  safeWithdrawalRatePct: number,
): number {
  const swrPct =
    safeWithdrawalRatePct > 0
      ? safeWithdrawalRatePct
      : DEFAULT_SAFE_WITHDRAWAL_RATE_PCT;
  const swr = swrPct / 100;
  return swr <= 0 ? 0 : roundInr(Math.max(0, annualExpenseTodayInr) / swr);
}

export function realFundedRatio(
  projection: RetirementProjection,
  annualExpenseTodayInr: number,
  safeWithdrawalRatePct: number,
): number {
  const target = realTargetCorpus(annualExpenseTodayInr, safeWithdrawalRatePct);
  return target <= 0 ? 0 : projection.projected_real_corpus_inr / target;
}

export function drawdownBalanceForMode(
  closingNominalInr: number,
  mode: RetirementDisplayMode,
  yearsToRetirement: number,
  drawdownYear: number,
  inflationPct: number,
): number {
  if (mode === "nominal") {
    return closingNominalInr;
  }
  return deflateToToday(
    closingNominalInr,
    inflationPct,
    yearsToRetirement + drawdownYear,
  );
}
