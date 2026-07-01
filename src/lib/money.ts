/** Half-up rounding to 2 decimal places (paise). See README rounding policy. */
export function roundInr(value: number): number {
  const scaled = value * 100;
  const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled));
  return rounded / 100;
}

/** Half-up rounding to cents (SPEC-US §4.0). */
export function roundUsd(value: number): number {
  return roundInr(value);
}

export function roundMoney(value: number, locale: "IN" | "US"): number {
  return locale === "US" ? roundUsd(value) : roundInr(value);
}
