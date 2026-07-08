import { describe, expect, it } from "vitest";
import { simulateDebtPayoff } from "../debt";
import { debtTimelineToCsv } from "./debtCsv";
import { debtResultToJson } from "./debtJson";
import { retirementTimelineToCsv } from "./retirementCsv";
import { retirementResultToJson } from "./retirementJson";
import { scheduleToCsv } from "./scheduleCsv";
import { scenarioToJson } from "./scenarioJson";
import { strategyComparisonToCsv } from "./strategyCsv";
import { strategyResultToJson } from "./strategyJson";
import type { ScheduleRow } from "../loan";
import type { DebtMonthRow } from "../debt";
import { makeReferenceDebts } from "../../test/factories";
import type { RetirementInput, RetirementYearRow } from "../retirement";
import type { StrategyResult } from "../strategy/types";

const sampleRows: ScheduleRow[] = [
  {
    month: 1,
    opening_inr: 5_000_000,
    interest_inr: 32_916.67,
    principal_inr: 10_000,
    prepayment_inr: 0,
    closing_inr: 4_990_000,
    payment_inr: 42_916.67,
    emi_inr: 42_916.67,
  },
];

describe("scheduleToCsv (SPEC §4.9)", () => {
  it("includes header and data rows", () => {
    const csv = scheduleToCsv(sampleRows);
    expect(csv.split("\n")[0]).toContain("opening_inr");
    expect(csv).toContain("1,5000000");
  });

  it("adds calendar_date column when start date provided", () => {
    const csv = scheduleToCsv(sampleRows, { startDateIso: "2026-01-15" });
    expect(csv.split("\n")[0]).toContain("calendar_date");
    expect(csv).toContain("2026-01-15");
  });

  it("includes cash balance column when requested", () => {
    const csv = scheduleToCsv(sampleRows, {
      includeCashBalance: true,
      cashBalances: [1_000_000],
    });
    expect(csv.split("\n")[0]).toContain("cash_balance_inr");
    expect(csv).toContain("1000000");
  });
});

describe("scenarioToJson (SPEC §4.9)", () => {
  it("serialises export payload", () => {
    const json = scenarioToJson({
      exported_at: "2026-01-01T00:00:00.000Z",
      scenario_id: "BASE",
      scenario_label: "BASE",
      inputs: { principal_inr: 5_000_000 },
      totals: {
        payoff_month: 168,
        total_interest_inr: 1,
        total_paid_inr: 2,
      },
    });
    const parsed = JSON.parse(json);
    expect(parsed.scenario_id).toBe("BASE");
    expect(parsed.inputs.principal_inr).toBe(5_000_000);
  });
});

const debtRows: DebtMonthRow[] = [
  {
    month: 1,
    opening_total_inr: 100_000,
    interest_inr: 500,
    payment_inr: 5_000,
    closing_total_inr: 95_500,
    focus_debt_name: "Card",
  },
];

describe("debtTimelineToCsv (SPEC §4.10)", () => {
  it("includes header and data rows", () => {
    const csv = debtTimelineToCsv(debtRows);
    expect(csv.split("\n")[0]).toContain("opening_total_inr");
    expect(csv).toContain("Card");
  });

  it("adds calendar_date when start date provided", () => {
    const csv = debtTimelineToCsv(debtRows, { startDateIso: "2026-03-01" });
    expect(csv.split("\n")[0]).toContain("calendar_date");
    expect(csv).toContain("2026-04-01");
  });

  it("keeps final row calendar_date aligned with JSON payoff_date_iso", () => {
    const debts = makeReferenceDebts();
    const result = simulateDebtPayoff(debts, 40_000, "2026-01-15", "avalanche");
    const csv = debtTimelineToCsv(result.rows, { startDateIso: "2026-01-15" });
    const lastRow = result.rows[result.rows.length - 1]!;
    const dataLine = csv.split("\n").find((line) => line.startsWith(`${lastRow.month},`));
    expect(dataLine).toContain(result.summary.payoff_date_iso);
  });
});

describe("debtResultToJson (SPEC §4.10)", () => {
  it("serialises debt export payload", () => {
    const json = debtResultToJson({
      exported_at: "2026-01-01T00:00:00.000Z",
      start_date: "2026-01-01",
      monthly_budget_inr: 10_000,
      debts: [],
      strategies: {
        avalanche: {
          summary: {
            payoff_months: 12,
            payoff_date_iso: "2026-12-01",
            total_interest_inr: 1_000,
            total_paid_inr: 50_000,
            is_paid_off: true,
          },
        },
      },
      active_strategy: "avalanche",
    });
    const parsed = JSON.parse(json);
    expect(parsed.active_strategy).toBe("avalanche");
    expect(parsed.monthly_budget_inr).toBe(10_000);
  });
});

const retirementRows: RetirementYearRow[] = [
  { year: 1, corpus_nominal_inr: 1_000_000, corpus_real_inr: 950_000 },
];

describe("retirementTimelineToCsv (SPEC §4.11)", () => {
  it("includes header and yearly rows", () => {
    const csv = retirementTimelineToCsv(retirementRows);
    expect(csv.split("\n")[0]).toContain("corpus_nominal_inr");
    expect(csv).toContain("1000000");
  });
});

describe("retirementResultToJson (SPEC §4.11)", () => {
  it("serialises retirement export payload", () => {
    const json = retirementResultToJson({
      exported_at: "2026-01-01T00:00:00.000Z",
      inputs: { years_to_retirement: 20 } as RetirementInput,
      scenarios: [],
      selected_scenario_id: "base",
    });
    const parsed = JSON.parse(json);
    expect(parsed.selected_scenario_id).toBe("base");
  });
});

const strategyRows: StrategyResult[] = [
  {
    strategy_id: "STRATEGY_EQUITY_BLEND",
    loan_close_month: 120,
    total_interest_inr: 500_000,
    interest_saved_vs_base_inr: 50_000,
    one_time_prepay_inr: 100_000,
    monthly_extra_principal_inr: 5_000,
    monthly_sip_inr: 3_000,
    equity_lump_inr: 50_000,
    equity_corpus_at_horizon_inr: 1_000_000,
    equity_corpus_at_horizon_post_tax_inr: 900_000,
    pf_corpus_at_horizon_inr: 200_000,
    cash_buffer_remaining_inr: 50_000,
    loan_balance_at_horizon_inr: 0,
    net_worth_at_horizon_inr: 1_150_000,
    min_living_budget_inr: 15_000,
    warnings: [],
  },
];

describe("strategyComparisonToCsv (SPEC §4.12)", () => {
  it("includes header and strategy rows", () => {
    const csv = strategyComparisonToCsv(strategyRows);
    expect(csv.split("\n")[0]).toContain("strategy_id");
    expect(csv).toContain("STRATEGY_EQUITY_BLEND");
  });
});

describe("strategyResultToJson (SPEC §4.12)", () => {
  it("serialises strategy export payload", () => {
    const json = strategyResultToJson({
      exported_at: "2026-01-01T00:00:00.000Z",
      inputs: {
        principal_inr: 5_000_000,
        annual_interest_rate: 7.9,
        tenure_months: 168,
        cash_inr: 500_000,
        pf_corpus_inr: 0,
        pf_annual_interest_rate_pct: 8.25,
        monthly_pf_addition_inr: 0,
        monthly_take_home_inr: 200_000,
        monthly_living_expense_inr: 50_000,
        extra_monthly_income_inr: 0,
        extra_income_post_tax: false,
        marginal_tax_rate_pct: 30,
        emergency_months_buffer: 6,
        expected_equity_return_pct: 12,
        horizon_months: 120,
      },
      results: strategyRows,
    });
    const parsed = JSON.parse(json);
    expect(parsed.results).toHaveLength(1);
    expect(parsed.inputs.principal_inr).toBe(5_000_000);
  });
});
