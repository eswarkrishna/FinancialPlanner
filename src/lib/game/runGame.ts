import type { GameInput } from "./gameInput";
import {
  runGameBhCoopPareto,
  runGameBhSimSplit,
  runGameBlSeqLFee,
  runGameBlSimFee,
  runGameBnSeqNUe,
  runGameBnSimUeTiming,
} from "./profiles";
import {
  runGameBhnStochRunway,
  runGameBlMixedFee,
  runGameBlSimRateBump,
  runGameBlhSimFull,
  runGameBlhnExtStress,
  runGameBlnSeqNFee,
} from "./profilesP1";
import type { GameProfileId, GameResult } from "./types";

export function runGame(input: GameInput): GameResult {
  switch (input.game_profile_id) {
    case "GAME_BL_SIM_FEE":
      return runGameBlSimFee(input);
    case "GAME_BL_SEQ_L_FEE":
      return runGameBlSeqLFee(input);
    case "GAME_BH_SIM_SPLIT":
      return runGameBhSimSplit(input);
    case "GAME_BH_COOP_PARETO":
      return runGameBhCoopPareto(input);
    case "GAME_BN_SEQ_N_UE":
      return runGameBnSeqNUe(input);
    case "GAME_BN_SIM_UE_TIMING":
      return runGameBnSimUeTiming(input);
    case "GAME_BLH_SIM_FULL":
      return runGameBlhSimFull(input);
    case "GAME_BLN_SEQ_N_FEE":
      return runGameBlnSeqNFee(input);
    case "GAME_BHN_STOCH_RUNWAY":
      return runGameBhnStochRunway(input);
    case "GAME_BLHN_EXT_STRESS":
      return runGameBlhnExtStress(input);
    case "GAME_BL_SIM_RATE_BUMP":
      return runGameBlSimRateBump(input);
    case "GAME_BL_MIXED_FEE":
      return runGameBlMixedFee(input);
    default: {
      const _exhaustive: never = input.game_profile_id;
      throw new Error(`Unknown game profile: ${String(_exhaustive)}`);
    }
  }
}

export function runGameByProfileId(
  profileId: GameProfileId,
  partial: Omit<GameInput, "game_profile_id"> & { game_profile_id?: GameProfileId },
): GameResult {
  return runGame({ ...partial, game_profile_id: profileId });
}
