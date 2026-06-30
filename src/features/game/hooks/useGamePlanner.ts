import { useMemo, useState } from "react";
import {
  P0_GAME_PROFILES,
  gameInputSchema,
  runGame,
  type GameProfileId,
  type GameResult,
} from "../../../lib/game";
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

  return {
    profileId,
    setProfileId,
    prepaymentFeeInr,
    setPrepaymentFeeInr,
    parsed,
    result,
    profiles: P0_GAME_PROFILES,
  };
}
