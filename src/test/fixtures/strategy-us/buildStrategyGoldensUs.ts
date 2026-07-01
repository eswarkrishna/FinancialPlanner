import { simulateStrategy } from "../../../lib/strategy/simulate";
import type { StrategyId, StrategyResult } from "../../../lib/strategy/types";
import {
  REFERENCE_TIERS,
  makeStrategyInputForTierUs,
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

export type StrategyUsGoldenName = `${ReferenceTier}_${
  | "equity_blend"
  | "prepay_heavy"
  | "aggressive_prepay"}`;

export type StrategyUsGoldenMap = Record<StrategyUsGoldenName, StrategyResult>;

/** SPEC-US §15.1 — nine US tier × strategy golden snapshots. */
export function computeStrategyGoldensUs(): StrategyUsGoldenMap {
  const map = {} as StrategyUsGoldenMap;
  for (const tier of REFERENCE_TIERS) {
    const input = makeStrategyInputForTierUs(tier);
    for (const strategy of STRATEGY_IDS) {
      const key = `${tier}_${strategyKey(strategy)}` as StrategyUsGoldenName;
      map[key] = simulateStrategy(strategy, input);
    }
  }
  return map;
}
