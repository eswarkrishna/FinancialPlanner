import { describe, expect, it } from "vitest";
import { computeStrategyGoldensUk } from "../../test/fixtures/strategy-uk/buildStrategyGoldensUk";
import tierAEquityBlend from "../../test/fixtures/strategy-uk/tier_a_equity_blend.json";
import tierAPrepayHeavy from "../../test/fixtures/strategy-uk/tier_a_prepay_heavy.json";
import tierAAggressivePrepay from "../../test/fixtures/strategy-uk/tier_a_aggressive_prepay.json";
import tierBEquityBlend from "../../test/fixtures/strategy-uk/tier_b_equity_blend.json";
import tierBPrepayHeavy from "../../test/fixtures/strategy-uk/tier_b_prepay_heavy.json";
import tierBAggressivePrepay from "../../test/fixtures/strategy-uk/tier_b_aggressive_prepay.json";
import tierCEquityBlend from "../../test/fixtures/strategy-uk/tier_c_equity_blend.json";
import tierCPrepayHeavy from "../../test/fixtures/strategy-uk/tier_c_prepay_heavy.json";
import tierCAggressivePrepay from "../../test/fixtures/strategy-uk/tier_c_aggressive_prepay.json";
import type { StrategyResult } from "./types";

const goldens = {
  tier_a_equity_blend: tierAEquityBlend,
  tier_a_prepay_heavy: tierAPrepayHeavy,
  tier_a_aggressive_prepay: tierAAggressivePrepay,
  tier_b_equity_blend: tierBEquityBlend,
  tier_b_prepay_heavy: tierBPrepayHeavy,
  tier_b_aggressive_prepay: tierBAggressivePrepay,
  tier_c_equity_blend: tierCEquityBlend,
  tier_c_prepay_heavy: tierCPrepayHeavy,
  tier_c_aggressive_prepay: tierCAggressivePrepay,
} as Record<string, StrategyResult>;

describe("strategy UK golden fixtures (SPEC-UK §15.1)", () => {
  it("matches every tier × strategy snapshot", () => {
    const computed = computeStrategyGoldensUk();
    for (const [name, expected] of Object.entries(goldens)) {
      expect(computed[name as keyof typeof computed], `${name} UK drift`).toEqual(
        expected,
      );
    }
  });
});
