/** Half-up rounding to 2 decimal places (paise). See README rounding policy. */
export function roundInr(value: number): number {
  const scaled = value * 100;
  const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled));
  return rounded / 100;
}
