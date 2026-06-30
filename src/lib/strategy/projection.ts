import { roundInr } from "../money";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";

/**
 * Spec §4.12.3 step 2 — equity sleeve monthly compounding.
 * Mirrors retirement projection in §4.11: round each step to paise for parity.
 */
export function projectEquityCorpusMonths(
  initialInr: number,
  monthlyContributionInr: number,
  annualReturnPct: number,
  months: number,
): number {
  const safeMonths = Math.max(0, Math.floor(months));
  if (safeMonths === 0) return roundInr(Math.max(0, initialInr));
  const r = nominalMonthlyRateFromAnnualPercent(Math.max(0, annualReturnPct));
  const contribution = Math.max(0, monthlyContributionInr);
  let corpus = roundInr(Math.max(0, initialInr));
  for (let m = 1; m <= safeMonths; m += 1) {
    const growth = roundInr(corpus * r);
    corpus = roundInr(corpus + growth + contribution);
  }
  return corpus;
}

/**
 * Spec §4.12.3 step 5 — PF projection over a horizon.
 * Annual credit at `pf_annual_interest_rate_pct` after a year's worth of monthly additions
 * is added (matches §4.7 canonical credit order). Partial trailing year accrues
 * monthly additions only; no proportional interest credit.
 */
export function projectPfCorpusMonths(
  initialInr: number,
  monthlyAdditionInr: number,
  annualRatePct: number,
  months: number,
): number {
  const safeMonths = Math.max(0, Math.floor(months));
  const monthlyAddition = Math.max(0, monthlyAdditionInr);
  const annualRate = Math.max(0, annualRatePct) / 100;
  let corpus = roundInr(Math.max(0, initialInr));
  const fullYears = Math.floor(safeMonths / 12);
  const trailingMonths = safeMonths - fullYears * 12;
  for (let y = 1; y <= fullYears; y += 1) {
    corpus = roundInr(corpus + monthlyAddition * 12);
    corpus = roundInr(corpus * (1 + annualRate));
  }
  corpus = roundInr(corpus + monthlyAddition * trailingMonths);
  return corpus;
}
