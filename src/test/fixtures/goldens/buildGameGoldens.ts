import { P0_GAME_PROFILES } from "../../../lib/game/constants";
import { runGame } from "../../../lib/game/runGame";
import type { GameProfileId, GameResult } from "../../../lib/game/types";
import { makeReferenceGameInput } from "../../factories/gameFactory";

/** Spec §15.2 — serialisable snapshot for golden comparison. */
export type GameGoldenSnapshot = {
  game_profile_id: GameProfileId;
  matrix_size: number;
  payoff_matrix: Array<{
    cell_key: string;
    action_profile: GameResult["payoff_matrix"][0]["action_profile"];
    payoffs: GameResult["payoff_matrix"][0]["payoffs"];
    underlying_scenario_id: string;
  }>;
  equilibria: GameResult["equilibria"];
  recommended_b_action?: GameResult["recommended_b_action"];
  warnings: GameResult["warnings"];
  underlying_scenario_ids: string[];
};

function compact(result: GameResult): GameGoldenSnapshot {
  return {
    game_profile_id: result.game_profile_id,
    matrix_size: result.payoff_matrix.length,
    payoff_matrix: result.payoff_matrix.map((c) => ({
      cell_key: c.cell_key,
      action_profile: c.action_profile,
      payoffs: c.payoffs,
      underlying_scenario_id: c.underlying_scenario_id,
    })),
    equilibria: result.equilibria,
    recommended_b_action: result.recommended_b_action,
    warnings: result.warnings,
    underlying_scenario_ids: result.underlying_scenario_ids,
  };
}

export type GameGoldenMap = Record<(typeof P0_GAME_PROFILES)[number], GameGoldenSnapshot>;

export function computeGameGoldens(): GameGoldenMap {
  const map = {} as GameGoldenMap;
  for (const profileId of P0_GAME_PROFILES) {
    const result = runGame(
      makeReferenceGameInput({ game_profile_id: profileId }),
    );
    map[profileId] = compact(result);
  }
  return map;
}
