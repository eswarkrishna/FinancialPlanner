import { roundInr } from "../money";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";

/** Monthly nominal rate from annual percent (e.g. 7.9 => 0.079/12). */
export function monthlyRateFromAnnualPercent(annualPercent: number): number {
  return nominalMonthlyRateFromAnnualPercent(annualPercent);
}

/**
 * Standard reducing-balance EMI (annuity). Spec §4.3.
 * Returns INR rounded to paise per project default.
 */
export function computeEmi(
  principalInr: number,
  annualPercent: number,
  tenureMonths: number,
): number {
  if (principalInr <= 0 || tenureMonths <= 0) {
    throw new RangeError("principal and tenure must be positive");
  }
  const r = monthlyRateFromAnnualPercent(annualPercent);
  if (r === 0) {
    return roundInr(principalInr / tenureMonths);
  }
  const pow = (1 + r) ** tenureMonths;
  const emi = (principalInr * r * pow) / (pow - 1);
  return roundInr(emi);
}
