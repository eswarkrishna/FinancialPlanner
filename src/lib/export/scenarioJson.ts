/** JSON export payload for a loan scenario run (SPEC §4.9). */
export interface ScenarioExportPayload {
  exported_at: string;
  scenario_id: string;
  scenario_label: string;
  inputs: Record<string, unknown>;
  totals: {
    payoff_month: number;
    total_interest_inr: number;
    total_paid_inr: number;
    total_prepayments_inr?: number;
    interest_delta_vs_base_inr?: number;
    min_cash_balance_inr?: number;
  };
  staged_prepayments?: { month: number; amount_inr: number }[];
}

export function scenarioToJson(payload: ScenarioExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

/** JSON export for game theory results (SPEC §4.13.9). */
export interface GameExportPayload {
  exported_at: string;
  game_profile_id: string;
  inputs: Record<string, unknown>;
  payoff_matrix: unknown[];
  equilibria: unknown[];
  recommended_b_action?: unknown;
  warnings: string[];
  underlying_scenario_ids: string[];
}

export function gameResultToJson(payload: GameExportPayload): string {
  return JSON.stringify(payload, null, 2);
}
