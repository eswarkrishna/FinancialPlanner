import { describe, expect, it } from "vitest";
import { EMPTY_LOAN_FORM } from "../../../lib/loan/loanFormFields";
import type { LoanScenarioSlot } from "../../../lib/persistence/loanScenarioSlots";
import { buildScenarioSlotRow, scenarioSlotLabel } from "./buildScenarioSlotRows";

function referenceSlot(overrides?: Partial<LoanScenarioSlot["state"]>): LoanScenarioSlot {
  return {
    id: "slot-ref",
    name: "Reference",
    saved_at: "2026-07-24T00:00:00.000Z",
    state: {
      inputs: {
        ...EMPTY_LOAN_FORM,
        principal_inr: "5000000",
        annual_interest_rate: "7.9",
        tenure_months: "168",
      },
      scenarioView: "BASE",
      prepaySource: "cash",
      stagedPrepays: [],
      rateChanges: [],
      ...overrides,
    },
  };
}

describe("buildScenarioSlotRow (SPEC §4.9.1, §10.99)", () => {
  it("recomputes the IN reference slot from its own saved state", () => {
    const row = buildScenarioSlotRow(referenceSlot(), "IN");
    expect(row.valid).toBe(true);
    expect(row.name).toBe("Reference");
    expect(row.scenarioLabel).toBe("Baseline");
    expect(row.payoffMonth).toBe(168);
    expect(row.emi).toBeCloseTo(49_282.45, 1);
    expect(row.totalInterest).toBeGreaterThan(0);
    expect(row.totalPaid).toBeGreaterThan(row.totalInterest);
  });

  it("uses the slot's saved scenario view for totals", () => {
    const base = buildScenarioSlotRow(referenceSlot(), "IN");
    const prepay = buildScenarioSlotRow(
      referenceSlot({
        inputs: {
          ...EMPTY_LOAN_FORM,
          principal_inr: "5000000",
          annual_interest_rate: "7.9",
          tenure_months: "168",
          cash_inr: "2500000",
        },
        scenarioView: "PREPAY_TENURE",
      }),
      "IN",
    );
    expect(prepay.valid).toBe(true);
    expect(prepay.scenarioLabel).toBe("Prepay + tenure");
    expect(prepay.totalInterest).toBeLessThan(base.totalInterest);
  });

  it("falls back to Baseline label and totals when the saved view has no bundle", () => {
    const base = buildScenarioSlotRow(referenceSlot(), "IN");
    // PREPAY_TENURE saved, but cash is 0 in the saved inputs → no prepay bundle.
    const row = buildScenarioSlotRow(
      referenceSlot({ scenarioView: "PREPAY_TENURE" }),
      "IN",
    );
    expect(row.valid).toBe(true);
    expect(row.scenarioLabel).toBe("Baseline");
    expect(row.payoffMonth).toBe(base.payoffMonth);
    expect(row.totalInterest).toBe(base.totalInterest);
  });

  it("marks a slot with unparsable inputs as invalid", () => {
    const row = buildScenarioSlotRow(
      referenceSlot({
        inputs: { ...EMPTY_LOAN_FORM, principal_inr: "-1" },
      }),
      "IN",
    );
    expect(row.valid).toBe(false);
    expect(row.payoffMonth).toBe(0);
  });
});

describe("scenarioSlotLabel", () => {
  it("maps views to user-facing labels per locale", () => {
    expect(scenarioSlotLabel("BASE", "IN")).toBe("Baseline");
    expect(scenarioSlotLabel("CASHFLOW_PLUS_PF", "IN")).toBe("Cash + PF");
    expect(scenarioSlotLabel("CASHFLOW_PLUS_PF", "US")).toBe("Cash + 401(k)");
  });
});
