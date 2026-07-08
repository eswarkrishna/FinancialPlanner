import { P0_GAME_PROFILES } from "../../../lib/game/constants";
import { runGame } from "../../../lib/game/runGame";
import type { GameProfileId, GameResult } from "../../../lib/game/types";
import { makeReferenceGameInputUs } from "../../factories/gameFactory";
import type { GameGoldenSnapshot } from "../goldens/buildGameGoldens";

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

export type GameGoldenMapUs = Record<GameProfileId, GameGoldenSnapshot>;

export function computeGameGoldensUs(): GameGoldenMapUs {
  const map = {} as GameGoldenMapUs;
  for (const profileId of P0_GAME_PROFILES) {
    const result = runGame(
      makeReferenceGameInputUs({ game_profile_id: profileId }),
    );
    map[profileId] = compact(result);
  }
  return map;
}
