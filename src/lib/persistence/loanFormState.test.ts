import { describe, expect, it, beforeEach } from "vitest";
import {
  LOAN_FORM_STORAGE_KEY,
  LOAN_FORM_STORAGE_VERSION,
  loanFormStorageKey,
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

  it("keeps each locale in a separate storage key", () => {
    writeLoanFormState({
      version: LOAN_FORM_STORAGE_VERSION,
      locale: "IN",
      inputs: { ...EMPTY_LOAN_FORM, principal_inr: "5000000" },
      scenarioView: "BASE",
      prepaySource: "cash",
      stagedPrepays: [],
    });
    writeLoanFormState({
      version: LOAN_FORM_STORAGE_VERSION,
      locale: "US",
      inputs: { ...EMPTY_LOAN_FORM, principal_inr: "400000" },
      scenarioView: "BASE",
      prepaySource: "cash",
      stagedPrepays: [],
    });

    expect(readLoanFormState("IN")?.inputs.principal_inr).toBe("5000000");
    expect(readLoanFormState("US")?.inputs.principal_inr).toBe("400000");
  });

  it("migrates legacy single-key storage to per-locale keys", () => {
    localStorage.setItem(
      LOAN_FORM_STORAGE_KEY,
      JSON.stringify({
        version: LOAN_FORM_STORAGE_VERSION,
        locale: "IN",
        inputs: { ...EMPTY_LOAN_FORM, principal_inr: "123" },
        scenarioView: "BASE",
        prepaySource: "cash",
        stagedPrepays: [],
      }),
    );

    expect(readLoanFormState("IN")?.inputs.principal_inr).toBe("123");
    expect(localStorage.getItem(LOAN_FORM_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(loanFormStorageKey("IN"))).not.toBeNull();
  });

  it("normalizes corrupt stagedPrepays without discarding loan inputs", () => {
    localStorage.setItem(
      loanFormStorageKey("IN"),
      JSON.stringify({
        version: LOAN_FORM_STORAGE_VERSION,
        locale: "IN",
        inputs: { ...EMPTY_LOAN_FORM, principal_inr: "5000000" },
        scenarioView: "BASE",
        prepaySource: "cash",
        stagedPrepays: null,
      }),
    );
    const stored = readLoanFormState("IN");
    expect(stored?.inputs.principal_inr).toBe("5000000");
    expect(stored?.stagedPrepays).toEqual([]);
  });

  it("rejects persisted state with invalid core fields", () => {
    localStorage.setItem(
      loanFormStorageKey("IN"),
      JSON.stringify({
        version: LOAN_FORM_STORAGE_VERSION,
        locale: "IN",
        inputs: null,
        scenarioView: "BASE",
        prepaySource: "cash",
        stagedPrepays: [],
      }),
    );
    expect(readLoanFormState("IN")).toBeNull();
  });

  it("ignores corrupt storage", () => {
    localStorage.setItem(loanFormStorageKey("IN"), "not-json");
    expect(readLoanFormState("IN")).toBeNull();
  });

  it("merges partial persisted inputs with defaults", () => {
    localStorage.setItem(
      loanFormStorageKey("IN"),
      JSON.stringify({
        version: LOAN_FORM_STORAGE_VERSION,
        locale: "IN",
        inputs: { principal_inr: "5000000" },
        scenarioView: "BASE",
        prepaySource: "cash",
        stagedPrepays: [],
      }),
    );
    const stored = readLoanFormState("IN");
    expect(stored?.inputs.principal_inr).toBe("5000000");
    expect(stored?.inputs.annual_interest_rate).toBe("");
    expect(stored?.inputs.tenure_months).toBe("");
  });
});
