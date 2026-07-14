import { describe, expect, it } from "vitest";
import {
  computePrepaymentFeeInr,
  computePrepaymentSavings,
} from "./prepaymentFee";

describe("computePrepaymentFeeInr (§4.4.1)", () => {
  it("returns 0 when type is none or prepaid principal is 0", () => {
    expect(
      computePrepaymentFeeInr(2_500_000, {
        prepayment_fee_type: "none",
        prepayment_fee_inr: 25_000,
      }),
    ).toBe(0);
    expect(
      computePrepaymentFeeInr(0, {
        prepayment_fee_type: "flat",
        prepayment_fee_inr: 25_000,
      }),
    ).toBe(0);
  });

  it("flat fee uses prepayment_fee_inr (§10.48)", () => {
    expect(
      computePrepaymentFeeInr(2_500_000, {
        prepayment_fee_type: "flat",
        prepayment_fee_inr: 25_000,
      }),
    ).toBe(25_000);
  });

  it("percent fee is pct of prepaid principal (§10.49)", () => {
    expect(
      computePrepaymentFeeInr(2_500_000, {
        prepayment_fee_type: "percent",
        prepayment_fee_pct: 1,
      }),
    ).toBe(25_000);
  });
});

describe("computePrepaymentSavings (§4.4.1)", () => {
  it("net savings = gross − fees; none-fee net equals gross (§10.50)", () => {
    const withFee = computePrepaymentSavings(1_000_000, 600_000, 25_000);
    expect(withFee.gross_interest_saved_inr).toBe(400_000);
    expect(withFee.prepayment_fees_inr).toBe(25_000);
    expect(withFee.net_savings_after_fee_inr).toBe(375_000);

    const noFee = computePrepaymentSavings(1_000_000, 600_000, 0);
    expect(noFee.net_savings_after_fee_inr).toBe(noFee.gross_interest_saved_inr);
  });
});
