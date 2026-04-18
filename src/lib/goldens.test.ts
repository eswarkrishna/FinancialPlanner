import { describe, expect, it } from "vitest";
import {
  baselineSchedule,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
} from "./loan";
import { computePfUnemploymentWithdrawalPlan } from "./pf";
import {
  makeReferenceLoanInput,
  makeReferencePfInput,
  makeReferencePrepayInput,
} from "../test/factories";
import baseGolden from "../test/fixtures/goldens/BASE.json";
import prepayTenureGolden from "../test/fixtures/goldens/PREPAY_CASH_25L_TENURE.json";
import uePfToLoanGolden from "../test/fixtures/goldens/UE_PF_TO_LOAN.json";

type GoldenSnapshot = {
  emi_inr: number;
  totals: {
    total_paid_inr: number;
    total_interest_inr: number;
    total_prepayments_inr: number;
    payoff_month: number;
  };
  first_row: {
    month: number;
    opening_inr: number;
    interest_inr: number;
    principal_inr: number;
    prepayment_inr: number;
    closing_inr: number;
    payment_inr: number;
    emi_inr: number;
  };
  row_12: {
    month: number;
    opening_inr: number;
    interest_inr: number;
    principal_inr: number;
    prepayment_inr: number;
    closing_inr: number;
    payment_inr: number;
    emi_inr: number;
  } | null;
  last_row: {
    month: number;
    opening_inr: number;
    interest_inr: number;
    principal_inr: number;
    prepayment_inr: number;
    closing_inr: number;
    payment_inr: number;
    emi_inr: number;
  } | null;
  row_count: number;
};

function compactPayload(result: {
  emi_inr?: number;
  totals: {
    total_paid_inr: number;
    total_interest_inr: number;
    total_prepayments_inr: number;
    payoff_month: number;
  };
  rows: Array<{
    month: number;
    opening_inr: number;
    interest_inr: number;
    principal_inr: number;
    prepayment_inr: number;
    closing_inr: number;
    payment_inr: number;
    emi_inr: number;
  }>;
}): GoldenSnapshot {
  return {
    emi_inr: result.emi_inr ?? result.rows[0]?.emi_inr ?? 0,
    totals: result.totals,
    first_row: result.rows[0]!,
    row_12: result.rows[11] ?? null,
    last_row: result.rows[result.rows.length - 1] ?? null,
    row_count: result.rows.length,
  };
}

describe("golden scenario snapshots (SPEC §10)", () => {
  it("matches BASE golden fixture", () => {
    const loan = makeReferenceLoanInput();
    const result = baselineSchedule(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
    );
    expect(compactPayload(result)).toEqual(baseGolden as GoldenSnapshot);
  });

  it("matches PREPAY_CASH_25L_TENURE golden fixture", () => {
    const loan = makeReferenceLoanInput();
    const prepay = makeReferencePrepayInput();
    const result = schedulePrepayKeepTenure(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      prepay.prepay_month,
      prepay.prepay_inr,
    );
    expect(compactPayload(result)).toEqual(prepayTenureGolden as GoldenSnapshot);
  });

  it("matches UE_PF_TO_LOAN golden fixture", () => {
    const loan = makeReferenceLoanInput();
    const pf = makeReferencePfInput();
    const pfPlan = computePfUnemploymentWithdrawalPlan(
      pf.pf_corpus_inr,
      pf.pf_annual_interest_rate_pct,
      pf.monthly_pf_addition_inr,
    );
    const result = scheduleTimedPrepaysKeepEmi(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      [
        { month: 1, amount_inr: pfPlan.tranche1_inr },
        { month: 12, amount_inr: pfPlan.tranche2_inr },
      ],
    );
    expect(compactPayload(result)).toEqual(uePfToLoanGolden as GoldenSnapshot);
  });
});
