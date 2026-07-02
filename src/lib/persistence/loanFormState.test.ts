import { describe, expect, it, beforeEach } from "vitest";
import {
  LOAN_FORM_STORAGE_KEY,
  LOAN_FORM_STORAGE_VERSION,
  readLoanFormState,
  writeLoanFormState,
} from "./loanFormState";
import { EMPTY_LOAN_FORM } from "../loan/loanFormFields";

describe("loanFormState (SPEC §4.9 v1.7)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes and reads persisted loan form for locale", () => {
    writeLoanFormState({
      version: LOAN_FORM_STORAGE_VERSION,
      locale: "IN",
      inputs: { ...EMPTY_LOAN_FORM, principal_inr: "5000000" },
      scenarioView: "PREPAY_EMI",
      prepaySource: "pf",
      stagedPrepays: [],
    });
    const stored = readLoanFormState("IN");
    expect(stored?.inputs.principal_inr).toBe("5000000");
    expect(stored?.scenarioView).toBe("PREPAY_EMI");
    expect(stored?.prepaySource).toBe("pf");
  });

  it("ignores stored state for a different locale", () => {
    writeLoanFormState({
      version: LOAN_FORM_STORAGE_VERSION,
      locale: "US",
      inputs: EMPTY_LOAN_FORM,
      scenarioView: "BASE",
      prepaySource: "cash",
      stagedPrepays: [],
    });
    expect(readLoanFormState("IN")).toBeNull();
  });

  it("ignores corrupt storage", () => {
    localStorage.setItem(LOAN_FORM_STORAGE_KEY, "not-json");
    expect(readLoanFormState("IN")).toBeNull();
  });
});
