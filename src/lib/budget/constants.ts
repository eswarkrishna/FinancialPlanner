import type { BudgetInput } from "./types";

export const BUDGET_TARGETS = {
  needs_pct: 50,
  wants_pct: 30,
  savings_pct: 20,
} as const;

export const REFERENCE_BUDGET_IN: BudgetInput = {
  month_label: "2026-07",
  income_lines: [
    { id: "inc-salary", name: "Salary", kind: "income", amount_inr: 150_000 },
    { id: "inc-freelance", name: "Freelance", kind: "income", amount_inr: 25_000 },
  ],
  expense_lines: [
    { id: "exp-rent", name: "Rent", kind: "expense", amount_inr: 35_000, bucket: "need" },
    { id: "exp-groceries", name: "Groceries", kind: "expense", amount_inr: 15_000, bucket: "need" },
    { id: "exp-utilities", name: "Utilities", kind: "expense", amount_inr: 5_000, bucket: "need" },
    { id: "exp-emi", name: "Home loan EMI", kind: "expense", amount_inr: 35_000, bucket: "need" },
    { id: "exp-insurance", name: "Insurance", kind: "expense", amount_inr: 5_000, bucket: "need" },
    { id: "exp-dining", name: "Dining out", kind: "expense", amount_inr: 12_000, bucket: "want" },
    { id: "exp-entertainment", name: "Entertainment", kind: "expense", amount_inr: 8_000, bucket: "want" },
    { id: "exp-sip", name: "SIP / investments", kind: "expense", amount_inr: 20_000, bucket: "savings" },
    { id: "exp-extra-debt", name: "Extra debt payment", kind: "expense", amount_inr: 5_000, bucket: "savings" },
  ],
  investments: [
    {
      id: "inv-equity",
      name: "Equity mutual fund",
      asset_class: "equity",
      current_value_inr: 800_000,
      monthly_contribution_inr: 15_000,
      expected_return_pct: 12,
    },
    {
      id: "inv-ppf",
      name: "PPF",
      asset_class: "debt",
      current_value_inr: 300_000,
      monthly_contribution_inr: 5_000,
      expected_return_pct: 7.1,
    },
    {
      id: "inv-fd",
      name: "Fixed deposit",
      asset_class: "debt",
      current_value_inr: 200_000,
      monthly_contribution_inr: 0,
      expected_return_pct: 6.5,
    },
  ],
  emergency_fund_inr: 150_000,
  projection_months: 12,
};

export const REFERENCE_BUDGET_US: BudgetInput = {
  month_label: "2026-07",
  income_lines: [
    { id: "inc-salary", name: "Salary", kind: "income", amount_inr: 6_500 },
    { id: "inc-freelance", name: "Side income", kind: "income", amount_inr: 1_200 },
  ],
  expense_lines: [
    { id: "exp-rent", name: "Rent", kind: "expense", amount_inr: 2_200, bucket: "need" },
    { id: "exp-groceries", name: "Groceries", kind: "expense", amount_inr: 600, bucket: "need" },
    { id: "exp-utilities", name: "Utilities", kind: "expense", amount_inr: 250, bucket: "need" },
    { id: "exp-mortgage", name: "Mortgage", kind: "expense", amount_inr: 1_800, bucket: "need" },
    { id: "exp-insurance", name: "Insurance", kind: "expense", amount_inr: 350, bucket: "need" },
    { id: "exp-dining", name: "Dining out", kind: "expense", amount_inr: 400, bucket: "want" },
    { id: "exp-entertainment", name: "Entertainment", kind: "expense", amount_inr: 300, bucket: "want" },
    { id: "exp-401k", name: "401(k) contribution", kind: "expense", amount_inr: 800, bucket: "savings" },
    { id: "exp-brokerage", name: "Brokerage SIP", kind: "expense", amount_inr: 500, bucket: "savings" },
  ],
  investments: [
    {
      id: "inv-401k",
      name: "401(k)",
      asset_class: "equity",
      current_value_inr: 85_000,
      monthly_contribution_inr: 800,
      expected_return_pct: 8,
    },
    {
      id: "inv-brokerage",
      name: "Taxable brokerage",
      asset_class: "equity",
      current_value_inr: 25_000,
      monthly_contribution_inr: 500,
      expected_return_pct: 9,
    },
  ],
  emergency_fund_inr: 12_000,
  projection_months: 12,
};

export const REFERENCE_BUDGET_UK: BudgetInput = {
  month_label: "2026-07",
  income_lines: [
    { id: "inc-salary", name: "Salary", kind: "income", amount_inr: 4_200 },
    { id: "inc-freelance", name: "Side income", kind: "income", amount_inr: 600 },
  ],
  expense_lines: [
    { id: "exp-rent", name: "Rent", kind: "expense", amount_inr: 1_400, bucket: "need" },
    { id: "exp-groceries", name: "Groceries", kind: "expense", amount_inr: 400, bucket: "need" },
    { id: "exp-utilities", name: "Utilities", kind: "expense", amount_inr: 180, bucket: "need" },
    { id: "exp-mortgage", name: "Mortgage", kind: "expense", amount_inr: 1_100, bucket: "need" },
    { id: "exp-council", name: "Council tax", kind: "expense", amount_inr: 200, bucket: "need" },
    { id: "exp-dining", name: "Dining out", kind: "expense", amount_inr: 250, bucket: "want" },
    { id: "exp-entertainment", name: "Entertainment", kind: "expense", amount_inr: 150, bucket: "want" },
    { id: "exp-isa", name: "ISA contribution", kind: "expense", amount_inr: 500, bucket: "savings" },
    { id: "exp-pension", name: "Workplace pension", kind: "expense", amount_inr: 350, bucket: "savings" },
  ],
  investments: [
    {
      id: "inv-isa",
      name: "Stocks & Shares ISA",
      asset_class: "equity",
      current_value_inr: 35_000,
      monthly_contribution_inr: 500,
      expected_return_pct: 7,
    },
    {
      id: "inv-pension",
      name: "Workplace pension",
      asset_class: "equity",
      current_value_inr: 42_000,
      monthly_contribution_inr: 350,
      expected_return_pct: 6.5,
    },
  ],
  emergency_fund_inr: 8_000,
  projection_months: 12,
};
