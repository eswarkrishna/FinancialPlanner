import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY_LOAN_FORM } from "../loan/loanFormFields";
import type { LoanFormSnapshot } from "./loanFormState";
import {
  deleteLoanScenarioSlot,
  loanScenarioSlotsKey,
  MAX_LOAN_SCENARIO_SLOTS,
  readLoanScenarioSlots,
  saveLoanScenarioSlot,
} from "./loanScenarioSlots";

function snapshot(principal: string): LoanFormSnapshot {
  return {
    inputs: { ...EMPTY_LOAN_FORM, principal_inr: principal },
    scenarioView: "BASE",
    prepaySource: "cash",
    stagedPrepays: [],
    rateChanges: [],
  };
}

describe("loanScenarioSlots (SPEC §4.9.1, §10.97)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and reads named slots per locale", () => {
    expect(saveLoanScenarioSlot("IN", "Plan A", snapshot("5000000")).success).toBe(true);
    expect(saveLoanScenarioSlot("IN", "Plan B", snapshot("6000000")).success).toBe(true);

    const slots = readLoanScenarioSlots("IN");
    expect(slots).toHaveLength(2);
    expect(slots[0]?.name).toBe("Plan A");
    expect(slots[0]?.state.inputs.principal_inr).toBe("5000000");
    expect(slots[1]?.name).toBe("Plan B");
    expect(readLoanScenarioSlots("US")).toHaveLength(0);
    expect(localStorage.getItem(loanScenarioSlotsKey("IN"))).toBeTruthy();
  });

  it("rejects a 6th distinct name with SLOTS_FULL and leaves storage unchanged", () => {
    for (let i = 1; i <= MAX_LOAN_SCENARIO_SLOTS; i += 1) {
      expect(saveLoanScenarioSlot("IN", `Plan ${i}`, snapshot("5000000")).success).toBe(
        true,
      );
    }
    const before = localStorage.getItem(loanScenarioSlotsKey("IN"));

    const result = saveLoanScenarioSlot("IN", "One too many", snapshot("1"));
    expect(result).toEqual({ success: false, reason: "SLOTS_FULL" });
    expect(localStorage.getItem(loanScenarioSlotsKey("IN"))).toBe(before);
    expect(readLoanScenarioSlots("IN")).toHaveLength(MAX_LOAN_SCENARIO_SLOTS);
  });

  it("overwrites an existing name case-insensitively without increasing the count", () => {
    saveLoanScenarioSlot("IN", "Plan A", snapshot("5000000"));
    const result = saveLoanScenarioSlot("IN", "plan a", snapshot("7500000"));
    expect(result.success).toBe(true);

    const slots = readLoanScenarioSlots("IN");
    expect(slots).toHaveLength(1);
    expect(slots[0]?.name).toBe("plan a");
    expect(slots[0]?.state.inputs.principal_inr).toBe("7500000");
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(saveLoanScenarioSlot("IN", "   ", snapshot("5000000"))).toEqual({
      success: false,
      reason: "EMPTY_NAME",
    });
    expect(readLoanScenarioSlots("IN")).toHaveLength(0);
  });

  it("reads a corrupt blob back as an empty list", () => {
    localStorage.setItem(loanScenarioSlotsKey("IN"), "{not json");
    expect(readLoanScenarioSlots("IN")).toEqual([]);

    localStorage.setItem(
      loanScenarioSlotsKey("IN"),
      JSON.stringify({ version: 1, slots: [{ id: "x", name: "bad", state: {} }] }),
    );
    expect(readLoanScenarioSlots("IN")).toEqual([]);
  });

  it("deletes a slot by id", () => {
    saveLoanScenarioSlot("IN", "Plan A", snapshot("5000000"));
    saveLoanScenarioSlot("IN", "Plan B", snapshot("6000000"));
    const [first] = readLoanScenarioSlots("IN");

    const remaining = deleteLoanScenarioSlot("IN", first!.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.name).toBe("Plan B");
    expect(readLoanScenarioSlots("IN")).toHaveLength(1);
  });
});
