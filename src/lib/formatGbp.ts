const fmt = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatGbp(value: number): string {
  return fmt.format(value);
}

export function formatGbpFinite(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return fmt.format(value);
}
