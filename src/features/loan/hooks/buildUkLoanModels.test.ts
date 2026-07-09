import { describe, expect, it } from "vitest";
import { REFERENCE_SCENARIO_UK } from "../../../lib/locale/constants";
import { buildUkLoanModels } from "./buildUkLoanModels";

describe("buildUkLoanModels", () => {
  it("does not force job-loss inflows in CASHFLOW_PLUS_PF when unemployment mode is off", () => {
    const models = buildUkLoanModels(
      { ...REFERENCE_SCENARIO_UK, unemployment_mode: false },
      "cash",
      [],
    );
    expect(models.cashflowPlusPf).not.toBeNull();
    const firstRowEvents = (models.cashflowPlusPf as { rows: Array<{ events: string[] }> })
      .rows[0]!.events;
    expect(firstRowEvents.some((e) => e.startsWith("jsa:"))).toBe(false);
  });

  it("funds PREPAY_TENURE from configured liquid balances", () => {
    const models = buildUkLoanModels(
      { ...REFERENCE_SCENARIO_UK, unemployment_mode: false },
      "isa",
      [],
    );
    expect(models.prepayTenure).not.toBeNull();
    const firstRowEvents = (models.prepayTenure as { rows: Array<{ events: string[] }> })
      .rows[0]!.events;
    expect(firstRowEvents.some((e) => e.startsWith("draw:isa:"))).toBe(true);
  });

  it("applies redundancy inflow for UE_PF_TO_LOAN even when unemployment mode is off", () => {
    const models = buildUkLoanModels(
      { ...REFERENCE_SCENARIO_UK, unemployment_mode: false },
      "cash",
      [],
    );
    expect(models.uePfToLoan).not.toBeNull();
    const firstRowEvents = (models.uePfToLoan as { rows: Array<{ events: string[] }> })
      .rows[0]!.events;
    expect(firstRowEvents.some((e) => e.startsWith("redundancy:net:"))).toBe(true);
  });

  it("PREPAY_EMI uses UK cashflow with lower payment after prepay", () => {
    const models = buildUkLoanModels(
      { ...REFERENCE_SCENARIO_UK, unemployment_mode: false },
      "cash",
      [],
    );
    expect(models.prepayTenure).not.toBeNull();
    expect(models.prepayEmi).not.toBeNull();
    const prepayEmi = models.prepayEmi as { emi_inr: number };
    const prepayTenure = models.prepayTenure as { emi_inr: number };
    expect(prepayEmi.emi_inr).toBeLessThan(models.base.emi_inr);
    expect(prepayTenure.emi_inr).toBe(models.base.emi_inr);
    const firstRowEvents = (models.prepayEmi as { rows: Array<{ events: string[] }> })
      .rows[0]!.events;
    expect(firstRowEvents.some((e) => e.startsWith("draw:cash:"))).toBe(true);
  });
});
