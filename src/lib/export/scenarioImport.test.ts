import { describe, expect, it } from "vitest";
import { scenarioToJson } from "./scenarioJson";
import { parseScenarioImportJson } from "./scenarioImport";
import { REFERENCE_SCENARIO_IN } from "../locale/constants";

describe("parseScenarioImportJson (SPEC §4.9 v1.7)", () => {
  it("round-trips exported scenario inputs", () => {
    const payload = {
      exported_at: "2026-01-01T00:00:00.000Z",
      scenario_id: "BASE",
      scenario_label: "BASE",
      inputs: {
        ...REFERENCE_SCENARIO_IN,
        prepay_source: "cash",
      },
      totals: {
        payoff_month: 168,
        total_interest_inr: 1,
        total_paid_inr: 2,
      },
    };
    const outcome = parseScenarioImportJson(scenarioToJson(payload));
    expect(outcome.success).toBe(true);
    if (!outcome.success) return;
    expect(outcome.inputs.principal_inr).toBe(String(REFERENCE_SCENARIO_IN.principal_inr));
    expect(outcome.inputs.annual_interest_rate).toBe(
      String(REFERENCE_SCENARIO_IN.annual_interest_rate),
    );
    expect(outcome.scenarioView).toBe("BASE");
    expect(outcome.prepaySource).toBe("cash");
  });

  it("returns error for invalid JSON", () => {
    const outcome = parseScenarioImportJson("{ not json");
    expect(outcome.success).toBe(false);
    if (outcome.success) return;
    expect(outcome.message).toMatch(/invalid json/i);
  });

  it("returns error when principal is missing", () => {
    const outcome = parseScenarioImportJson(
      JSON.stringify({
        scenario_id: "BASE",
        inputs: { annual_interest_rate: 7.9, tenure_months: 168 },
      }),
    );
    expect(outcome.success).toBe(false);
  });
});
