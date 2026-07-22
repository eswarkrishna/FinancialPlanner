import { formatGbp, formatGbpFinite } from "../formatGbp";
import { formatInr, formatInrFinite } from "../formatInr";
import { formatUsd, formatUsdFinite } from "../formatUsd";
import { inrLakhCroreSuffix } from "./formatMoneyEcho";
import type { Locale } from "./types";

export function formatMoney(value: number, locale: Locale): string {
  if (locale === "US") return formatUsd(value);
  if (locale === "UK") return formatGbp(value);
  return formatInr(value);
}

export function formatMoneyFinite(value: number, locale: Locale): string {
  if (locale === "US") return formatUsdFinite(value);
  if (locale === "UK") return formatGbpFinite(value);
  return formatInrFinite(value);
}

const inrKpiFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const usdKpiFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const gbpKpiFmt = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

/** Headline KPI amounts — whole currency units; INR adds lakh/crore suffix (§8, Phase 5.1.7). */
export function formatMoneyKpi(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value);
  if (locale === "US") return usdKpiFmt.format(rounded);
  if (locale === "UK") return gbpKpiFmt.format(rounded);
  const formatted = inrKpiFmt.format(rounded);
  const suffix = inrLakhCroreSuffix(rounded);
  return suffix ? `${formatted} · ${suffix}` : formatted;
}
