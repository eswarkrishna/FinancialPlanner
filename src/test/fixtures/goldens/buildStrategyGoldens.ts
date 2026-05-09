import { simulateStrategy } from "../../../lib/strategy/simulate";
import type {
  StrategyId,
  StrategyResult,
} from "../../../lib/strategy/types";
import {
  REFERENCE_TIERS,
  type ReferenceTier,
  makeStrategyInputForTier,
} from "../../factories";

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

export type StrategyGoldenName = `${ReferenceTier}_${
  | "equity_blend"
  | "prepay_heavy"
  | "aggressive_prepay"}`;

export type StrategyGoldenMap = Record<StrategyGoldenName, StrategyResult>;

export function computeStrategyGoldens(): StrategyGoldenMap {
  const map = {} as StrategyGoldenMap;
  for (const tier of REFERENCE_TIERS) {
    const input = makeStrategyInputForTier(tier);
    for (const strategy of STRATEGY_IDS) {
      const key = `${tier}_${strategyKey(strategy)}` as StrategyGoldenName;
      map[key] = simulateStrategy(strategy, input);
    }
  }
  return map;
}
