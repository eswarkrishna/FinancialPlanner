import { describe, expect, it } from "vitest";
import {
  computeGameGoldens,
  type GameGoldenMap,
} from "../../test/fixtures/goldens/buildGameGoldens";
import gameBlSimFee from "../../test/fixtures/game/GAME_BL_SIM_FEE.json";
import gameBlSeqLFee from "../../test/fixtures/game/GAME_BL_SEQ_L_FEE.json";
import gameBhSimSplit from "../../test/fixtures/game/GAME_BH_SIM_SPLIT.json";
import gameBhCoopPareto from "../../test/fixtures/game/GAME_BH_COOP_PARETO.json";
import gameBnSeqNUe from "../../test/fixtures/game/GAME_BN_SEQ_N_UE.json";
import gameBnSimUeTiming from "../../test/fixtures/game/GAME_BN_SIM_UE_TIMING.json";
import type { GameGoldenSnapshot } from "../../test/fixtures/goldens/buildGameGoldens";

const goldens: GameGoldenMap = {
  GAME_BL_SIM_FEE: gameBlSimFee as GameGoldenSnapshot,
  GAME_BL_SEQ_L_FEE: gameBlSeqLFee as GameGoldenSnapshot,
  GAME_BH_SIM_SPLIT: gameBhSimSplit as GameGoldenSnapshot,
  GAME_BH_COOP_PARETO: gameBhCoopPareto as GameGoldenSnapshot,
  GAME_BN_SEQ_N_UE: gameBnSeqNUe as GameGoldenSnapshot,
  GAME_BN_SIM_UE_TIMING: gameBnSimUeTiming as GameGoldenSnapshot,
};

describe("game golden fixtures (SPEC §10 #14, §15.2)", () => {
  it("matches every Tier P0 profile snapshot", () => {
    const computed = computeGameGoldens();
    for (const [name, expected] of Object.entries(goldens) as Array<
      [keyof GameGoldenMap, GameGoldenSnapshot]
    >) {
      expect(computed[name], `${name} drift`).toEqual(expected);
    }
  });
});
