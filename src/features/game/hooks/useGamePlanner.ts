import { useMemo, useState } from "react";
import {
  P0_GAME_PROFILES,
  gameInputSchema,
  runGame,
  type GameProfileId,
  type GameResult,
} from "../../../lib/game";
import { downloadTextFile, gameResultToJson } from "../../../lib/export";
import { REFERENCE_SCENARIO } from "../../../lib/loanInputSchema";

const DEFAULT_PROFILE: GameProfileId = "GAME_BL_SIM_FEE";

export function useGamePlanner() {
  const [profileId, setProfileId] = useState<GameProfileId>(DEFAULT_PROFILE);
  const [prepaymentFeeInr, setPrepaymentFeeInr] = useState("25000");

  const parsed = useMemo(() => {
    return gameInputSchema.safeParse({
      ...REFERENCE_SCENARIO,
      game_profile_id: profileId,
      prepayment_fee_inr: prepaymentFeeInr,
      horizon_months: REFERENCE_SCENARIO.tenure_months,
    });
  }, [profileId, prepaymentFeeInr]);

  const result: GameResult | null = useMemo(() => {
    if (!parsed.success) return null;
    return runGame(parsed.data);
  }, [parsed]);

  function exportGameJson() {
    if (!parsed.success || !result) return;
    const json = gameResultToJson({
      exported_at: new Date().toISOString(),
      game_profile_id: profileId,
      inputs: parsed.data as Record<string, unknown>,
      payoff_matrix: result.payoff_matrix,
      equilibria: result.equilibria,
      recommended_b_action: result.recommended_b_action,
      warnings: result.warnings,
      underlying_scenario_ids: result.underlying_scenario_ids,
    });
    downloadTextFile(`game-${profileId.toLowerCase()}.json`, json, "application/json;charset=utf-8");
  }

  return {
    profileId,
    setProfileId,
    prepaymentFeeInr,
    setPrepaymentFeeInr,
    parsed,
    result,
    profiles: P0_GAME_PROFILES,
    exportGameJson,
  };
}
