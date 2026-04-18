/** Monthly nominal rate from annual percent (e.g. 7.9 => 0.079/12). */
export function nominalMonthlyRateFromAnnualPercent(annualPercent: number): number {
  return annualPercent / 100 / 12;
}
