import { useEffect, useMemo, useRef, useState } from "react";
import {
  P0_GAME_PROFILES,
  gameInputSchema,
  runGame,
  type GameProfileId,
  type GameResult,
} from "../../../lib/game";
import { downloadTextFile, gameResultToJson } from "../../../lib/export";
import {
  referenceScenarioForLocale,
  useLocale,
} from "../../locale/LocaleContext";

const DEFAULT_PROFILE: GameProfileId = "GAME_BL_SIM_FEE";

function defaultPrepaymentFee(locale: "IN" | "US"): string {
  return locale === "US" ? "250" : "25000";
}

export function useGamePlanner() {
  const { locale, localeEpoch } = useLocale();
  const [profileId, setProfileId] = useState<GameProfileId>(DEFAULT_PROFILE);
  const [prepaymentFeeInr, setPrepaymentFeeInr] = useState(() =>
    defaultPrepaymentFee(locale),
  );

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setProfileId(DEFAULT_PROFILE);
    setPrepaymentFeeInr(defaultPrepaymentFee(locale));
  }, [locale, localeEpoch]);

  const parsed = useMemo(() => {
    const reference = referenceScenarioForLocale(locale);
    return gameInputSchema.safeParse({
      ...reference,
      game_profile_id: profileId,
      prepayment_fee_inr: prepaymentFeeInr,
      horizon_months: reference.tenure_months,
    });
  }, [profileId, prepaymentFeeInr, locale]);

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
      underlying_scenario_ids: result.underlying_scenario_ids,
      warnings: result.warnings,
    });
    downloadTextFile(`game-${profileId.toLowerCase()}.json`, json, "application/json");
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
    locale,
  };
}
