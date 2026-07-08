import type { StrategyInputs, StrategyResult } from "../strategy/types";

/** JSON export payload for repayment strategy planner (SPEC §4.12). */
export interface StrategyExportPayload {
  exported_at: string;
  inputs: StrategyInputs;
  results: StrategyResult[];
}

export function strategyResultToJson(payload: StrategyExportPayload): string {
  return JSON.stringify(payload, null, 2);
}
