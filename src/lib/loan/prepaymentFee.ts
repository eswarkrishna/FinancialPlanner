import { roundInr } from "../money";

/** Spec §4.4.1 — loan-tab prepayment / foreclosure fee type. */
export type PrepaymentFeeType = "none" | "flat" | "percent";

export interface PrepaymentFeeInput {
  prepayment_fee_type?: PrepaymentFeeType | null;
  prepayment_fee_inr?: number | null;
  prepayment_fee_pct?: number | null;
}

/**
 * Fee charged on a lump prepayment that reduces principal by `prepaidPrincipalInr`.
 * Fee is a cash outflow and does not reduce principal (SPEC §4.4.1).
 */
export function computePrepaymentFeeInr(
  prepaidPrincipalInr: number,
  input: PrepaymentFeeInput,
): number {
  if (prepaidPrincipalInr <= 0) return 0;
  const type = input.prepayment_fee_type ?? "none";
  if (type === "none") return 0;
  if (type === "flat") {
    return roundInr(Math.max(0, input.prepayment_fee_inr ?? 0));
  }
  const pct = Math.max(0, input.prepayment_fee_pct ?? 0);
  return roundInr((pct / 100) * prepaidPrincipalInr);
}

export interface PrepaymentSavings {
  gross_interest_saved_inr: number;
  prepayment_fees_inr: number;
  net_savings_after_fee_inr: number;
}

/** Gross interest saved vs BASE, minus fees (SPEC §4.4.1). */
export function computePrepaymentSavings(
  baseInterestInr: number,
  scenarioInterestInr: number,
  prepaymentFeesInr: number,
): PrepaymentSavings {
  const gross = roundInr(baseInterestInr - scenarioInterestInr);
  const fees = roundInr(Math.max(0, prepaymentFeesInr));
  return {
    gross_interest_saved_inr: gross,
    prepayment_fees_inr: fees,
    net_savings_after_fee_inr: roundInr(gross - fees),
  };
}
