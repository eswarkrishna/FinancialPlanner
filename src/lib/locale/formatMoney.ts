import { formatInr, formatInrFinite } from "../formatInr";
import { formatUsd, formatUsdFinite } from "../formatUsd";
import type { Locale } from "./types";

export function formatMoney(value: number, locale: Locale): string {
  return locale === "US" ? formatUsd(value) : formatInr(value);
}

export function formatMoneyFinite(value: number, locale: Locale): string {
  return locale === "US" ? formatUsdFinite(value) : formatInrFinite(value);
}
