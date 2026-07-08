import type { RetirementInput, RetirementScenarioResult } from "../retirement";

/** JSON export payload for retirement planner (SPEC §4.11). */
export interface RetirementExportPayload {
  exported_at: string;
  inputs: RetirementInput;
  scenarios: RetirementScenarioResult[];
  selected_scenario_id: string;
}

export function retirementResultToJson(payload: RetirementExportPayload): string {
  return JSON.stringify(payload, null, 2);
}
