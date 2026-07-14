import { describe, expect, it } from "vitest";
import { REFERENCE_SCENARIO_IN } from "../../../lib/locale/constants";
import { buildLoanModels } from "./buildLoanModels";
import {
  buildComparisonRows,
  buildPrepayStrategyCompare,
} from "./buildComparisonRows";

describe("prepayment fee & strategy compare (§4.4.1–§4.4.2 / §10.48–51)", () => {
  const baseModels = () =>
    buildLoanModels(
      { ...REFERENCE_SCENARIO_IN, monthly_salary_inr: 0 },
      "cash",
      0,
      [],
      "IN",
    );

  it("flat fee: net savings = gross − 25_000 (§10.48)", () => {
    const models = buildLoanModels(
      {
        ...REFERENCE_SCENARIO_IN,
        monthly_salary_inr: 0,
        prepayment_fee_type: "flat",
        prepayment_fee_inr: 25_000,
      },
      "cash",
      0,
      [],
      "IN",
    );
    const baseInterest = models.base.totals.total_interest_inr;
    const rows = buildComparisonRows(models, baseInterest, 0, "IN");
    const keepEmi = rows.find((r) => r.id === "PREPAY_EMI")!;
    const keepTenure = rows.find((r) => r.id === "PREPAY_TENURE")!;

    expect(keepEmi.prepaymentFees).toBe(25_000);
    expect(keepEmi.netSavingsAfterFee).toBe(keepEmi.grossInterestSaved - 25_000);
    expect(keepTenure.prepaymentFees).toBe(25_000);
    expect(keepTenure.netSavingsAfterFee).toBe(
      keepTenure.grossInterestSaved - 25_000,
    );
  });

  it("percent fee 1% of ₹25L prepay = ₹25_000 (§10.49)", () => {
    const models = buildLoanModels(
      {
        ...REFERENCE_SCENARIO_IN,
        monthly_salary_inr: 0,
        prepayment_fee_type: "percent",
        prepayment_fee_pct: 1,
      },
      "cash",
      0,
      [],
      "IN",
    );
    const rows = buildComparisonRows(
      models,
      models.base.totals.total_interest_inr,
      0,
      "IN",
    );
    expect(rows.find((r) => r.id === "PREPAY_EMI")!.prepaymentFees).toBe(25_000);
  });

  it("none fee: net equals gross (§10.50)", () => {
    const models = baseModels();
    const rows = buildComparisonRows(
      models,
      models.base.totals.total_interest_inr,
      0,
      "IN",
    );
    const keepEmi = rows.find((r) => r.id === "PREPAY_EMI")!;
    expect(keepEmi.prepaymentFees).toBe(0);
    expect(keepEmi.netSavingsAfterFee).toBe(keepEmi.grossInterestSaved);
  });

  it("strategy panel exposes both policies with selectable ids (§10.51)", () => {
    const models = baseModels();
    const compare = buildPrepayStrategyCompare(
      models,
      models.base.totals.total_interest_inr,
      "IN",
    );
    expect(compare).not.toBeNull();
    expect(compare!.map((r) => r.id)).toEqual(["PREPAY_EMI", "PREPAY_TENURE"]);
    expect(compare![0]!.newEmi).toBe(models.base.emi_inr);
    expect(compare![0]!.newTenureMonths).toBeLessThan(168);
    expect(compare![1]!.newEmi).toBeLessThan(models.base.emi_inr);
    expect(compare![1]!.newTenureMonths).toBe(168);
  });
});
