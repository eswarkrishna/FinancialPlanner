import { simulateStrategyUk } from "../../../lib/strategy/simulateUk";
import type { StrategyId, StrategyResult } from "../../../lib/strategy/types";
import {
  REFERENCE_TIERS,
  makeStrategyInputForTierUk,
  type ReferenceTier,
} from "../../factories/strategyFactory";

const STRATEGY_IDS: StrategyId[] = [
  "STRATEGY_EQUITY_BLEND",
  "STRATEGY_PREPAY_HEAVY",
  "STRATEGY_AGGRESSIVE_PREPAY",
];

function strategyKey(strategyId: StrategyId): string {
  switch (strategyId) {
    case "STRATEGY_EQUITY_BLEND":
      return "equity_blend";
    case "STRATEGY_PREPAY_HEAVY":
      return "prepay_heavy";
    case "STRATEGY_AGGRESSIVE_PREPAY":
      return "aggressive_prepay";
  }
}

export type StrategyUkGoldenName = `${ReferenceTier}_${
  | "equity_blend"
  | "prepay_heavy"
  | "aggressive_prepay"}`;

export type StrategyUkGoldenMap = Record<StrategyUkGoldenName, StrategyResult>;

/** SPEC-UK §15.1 — nine UK tier × strategy golden snapshots. */
export function computeStrategyGoldensUk(): StrategyUkGoldenMap {
  const map = {} as StrategyUkGoldenMap;
  for (const tier of REFERENCE_TIERS) {
    const input = makeStrategyInputForTierUk(tier);
    for (const strategy of STRATEGY_IDS) {
      const key = `${tier}_${strategyKey(strategy)}` as StrategyUkGoldenName;
      map[key] = simulateStrategyUk(strategy, input);
    }
  }
  return map;
}
