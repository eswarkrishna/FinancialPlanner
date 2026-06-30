const fmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatInr(value: number): string {
  return fmt.format(value);
}

/** Use when values may be NaN/±Infinity (e.g. unstable debt simulations). */
export function formatInrFinite(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return fmt.format(value);
}
