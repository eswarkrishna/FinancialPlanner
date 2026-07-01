import { describe, expect, it } from "vitest";
import {
  computeStrategyGoldensUs,
  type StrategyUsGoldenName,
} from "../../test/fixtures/strategy-us/buildStrategyGoldensUs";
import tierAEquityBlend from "../../test/fixtures/strategy-us/tier_a_equity_blend.json";
import tierAPrepayHeavy from "../../test/fixtures/strategy-us/tier_a_prepay_heavy.json";
import tierAAggressivePrepay from "../../test/fixtures/strategy-us/tier_a_aggressive_prepay.json";
import tierBEquityBlend from "../../test/fixtures/strategy-us/tier_b_equity_blend.json";
import tierBPrepayHeavy from "../../test/fixtures/strategy-us/tier_b_prepay_heavy.json";
import tierBAggressivePrepay from "../../test/fixtures/strategy-us/tier_b_aggressive_prepay.json";
import tierCEquityBlend from "../../test/fixtures/strategy-us/tier_c_equity_blend.json";
import tierCPrepayHeavy from "../../test/fixtures/strategy-us/tier_c_prepay_heavy.json";
import tierCAggressivePrepay from "../../test/fixtures/strategy-us/tier_c_aggressive_prepay.json";
import type { StrategyResult } from "./types";

const goldens: Record<StrategyUsGoldenName, StrategyResult> = {
  tier_a_equity_blend: tierAEquityBlend as StrategyResult,
  tier_a_prepay_heavy: tierAPrepayHeavy as StrategyResult,
  tier_a_aggressive_prepay: tierAAggressivePrepay as StrategyResult,
  tier_b_equity_blend: tierBEquityBlend as StrategyResult,
  tier_b_prepay_heavy: tierBPrepayHeavy as StrategyResult,
  tier_b_aggressive_prepay: tierBAggressivePrepay as StrategyResult,
  tier_c_equity_blend: tierCEquityBlend as StrategyResult,
  tier_c_prepay_heavy: tierCPrepayHeavy as StrategyResult,
  tier_c_aggressive_prepay: tierCAggressivePrepay as StrategyResult,
};

describe("US strategy golden fixtures (SPEC-US §10 #11, §15.1)", () => {
  it("matches every US tier × strategy snapshot", () => {
    const computed = computeStrategyGoldensUs();
    for (const [name, expected] of Object.entries(goldens) as Array<
      [StrategyUsGoldenName, StrategyResult]
    >) {
      expect(computed[name], `${name} drift`).toEqual(expected);
    }
  });
});
