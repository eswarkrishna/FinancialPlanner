const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatUsd(value: number): string {
  return fmt.format(value);
}

export function formatUsdFinite(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return fmt.format(value);
}
