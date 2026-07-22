import { formatGbp, formatGbpFinite } from "../formatGbp";
import { formatInr, formatInrFinite } from "../formatInr";
import { formatUsd, formatUsdFinite } from "../formatUsd";
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

/** Headline KPI amounts — whole currency units only (paise/cents in schedule tables). */
export function formatMoneyKpi(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value);
  if (locale === "US") return usdKpiFmt.format(rounded);
  if (locale === "UK") return gbpKpiFmt.format(rounded);
  return inrKpiFmt.format(rounded);
}
