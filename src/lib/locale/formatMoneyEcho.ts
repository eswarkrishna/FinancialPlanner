import { formatMoneyKpi } from "./formatMoney";
import type { Locale } from "./types";

function inrLakhCroreSuffix(value: number): string | null {
  const abs = Math.abs(value);
  if (abs >= 10_000_000) {
    const crore = value / 10_000_000;
    const label = Number.isInteger(crore)
      ? String(crore)
      : parseFloat(crore.toFixed(2)).toString();
    return `${label} crore`;
  }
  if (abs >= 100_000) {
    const lakh = value / 100_000;
    const label = Number.isInteger(lakh) ? String(lakh) : lakh.toFixed(2);
    return `${label} lakh`;
  }
  return null;
}

/** Live formatted echo for currency inputs (§8 mobile UX). */
export function formatMoneyEcho(value: number, locale: Locale): string | null {
  if (!Number.isFinite(value) || value === 0) return null;

  const formatted = formatMoneyKpi(value, locale);
  if (locale === "IN") {
    const suffix = inrLakhCroreSuffix(value);
    return suffix ? `${formatted} · ${suffix}` : formatted;
  }
  return formatted;
}
