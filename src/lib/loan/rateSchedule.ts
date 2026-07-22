import { computeEmi, monthlyRateFromAnnualPercent } from "./emi";
import type { ParsedRateChange } from "./rateChanges";

export type LoanRateConfig = {
  rate_type: "fixed" | "floating";
  annual_interest_rate: number;
  rate_changes: ParsedRateChange[];
};

export function loanRateConfigFrom(
  annualInterestRate: number,
  rateType: "fixed" | "floating" = "fixed",
  rateChanges: ParsedRateChange[] = [],
): LoanRateConfig {
  return {
    rate_type: rateType,
    annual_interest_rate: annualInterestRate,
    rate_changes: rateChanges,
  };
}

/** Annual nominal % effective at the start of month `month` (1-based). §4.3.1 */
export function annualRateForMonth(month: number, config: LoanRateConfig): number {
  if (config.rate_type !== "floating" || config.rate_changes.length === 0) {
    return config.annual_interest_rate;
  }
  let rate = config.annual_interest_rate;
  for (const change of config.rate_changes) {
    if (change.month <= month) {
      rate = change.annual_rate;
    } else {
      break;
    }
  }
  return rate;
}

export function monthlyContextForScheduleMonth(
  month: number,
  openingBalance: number,
  tenureMonths: number,
  config: LoanRateConfig,
  fixedEmi: number | null,
  previousAnnualRate: number | null,
): { annualPercent: number; monthlyRate: number; emi: number } {
  const annualPercent = annualRateForMonth(month, config);
  const rateChanged =
    config.rate_type === "floating" &&
    (previousAnnualRate === null || annualPercent !== previousAnnualRate);
  const remaining = tenureMonths - month + 1;
  let emi = fixedEmi;
  if (config.rate_type === "floating" && (month === 1 || rateChanged)) {
    emi = computeEmi(openingBalance, annualPercent, remaining);
  } else if (config.rate_type === "fixed" && month === 1) {
    emi = computeEmi(openingBalance, annualPercent, remaining);
  }
  return {
    annualPercent,
    monthlyRate: monthlyRateFromAnnualPercent(annualPercent),
    emi: emi ?? computeEmi(openingBalance, annualPercent, remaining),
  };
}

/** Fixed-rate EMI for full tenure (baseline §4.3 fast path). */
export function fixedBaselineEmi(
  principalInr: number,
  annualPercent: number,
  tenureMonths: number,
): number {
  return computeEmi(principalInr, annualPercent, tenureMonths);
}

export function usesFloatingRate(config: LoanRateConfig): boolean {
  return config.rate_type === "floating" && config.rate_changes.length > 0;
}
