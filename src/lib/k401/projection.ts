import { roundUsd } from "../money";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";

/**
 * SPEC-US §4.12 — 401(k) projection (same cadence as IN PF projection).
 */
export function projectK401CorpusMonths(
  initialUsd: number,
  monthlyAdditionUsd: number,
  annualRatePct: number,
  months: number,
): number {
  const safeMonths = Math.max(0, Math.floor(months));
  const monthlyAddition = Math.max(0, monthlyAdditionUsd);
  const annualRate = Math.max(0, annualRatePct) / 100;
  let corpus = roundUsd(Math.max(0, initialUsd));
  const fullYears = Math.floor(safeMonths / 12);
  const trailingMonths = safeMonths - fullYears * 12;
  for (let y = 1; y <= fullYears; y += 1) {
    corpus = roundUsd(corpus + monthlyAddition * 12);
    corpus = roundUsd(corpus * (1 + annualRate));
  }
  corpus = roundUsd(corpus + monthlyAddition * trailingMonths);
  return corpus;
}

/**
 * Equity sleeve monthly compounding (SPEC-US §4.12).
 */
export function projectBrokerageCorpusMonths(
  initialUsd: number,
  monthlyContributionUsd: number,
  annualReturnPct: number,
  months: number,
): number {
  const safeMonths = Math.max(0, Math.floor(months));
  if (safeMonths === 0) return roundUsd(Math.max(0, initialUsd));
  const r = nominalMonthlyRateFromAnnualPercent(Math.max(0, annualReturnPct));
  const contribution = Math.max(0, monthlyContributionUsd);
  let corpus = roundUsd(Math.max(0, initialUsd));
  for (let m = 1; m <= safeMonths; m += 1) {
    const growth = roundUsd(corpus * r);
    corpus = roundUsd(corpus + growth + contribution);
  }
  return corpus;
}
