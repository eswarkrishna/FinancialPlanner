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
