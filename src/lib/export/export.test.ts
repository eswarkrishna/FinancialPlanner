import { describe, expect, it } from "vitest";
import { scheduleToCsv } from "./scheduleCsv";
import { scenarioToJson } from "./scenarioJson";
import type { ScheduleRow } from "../loan";

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
