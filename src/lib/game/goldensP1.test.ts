import { describe, expect, it } from "vitest";
import { P1_GAME_PROFILES } from "./constants";
import { computeGameGoldensP1 } from "../../test/fixtures/goldens/buildGameGoldens";
import type { GameGoldenSnapshot } from "../../test/fixtures/goldens/buildGameGoldens";

type P1ProfileId = (typeof P1_GAME_PROFILES)[number];

const fixtureModules = import.meta.glob<{ default: GameGoldenSnapshot }>(
  "../../test/fixtures/game/GAME_*.json",
  { eager: true },
);

const p1Goldens = P1_GAME_PROFILES.reduce(
  (acc, id) => {
    const mod = fixtureModules[`../../test/fixtures/game/${id}.json`];
    if (mod?.default) acc[id] = mod.default;
    return acc;
  },
  {} as Record<P1ProfileId, GameGoldenSnapshot>,
);

describe("game P1 golden fixtures (SPEC §4.13.8)", () => {
  it("matches every Tier P1 profile snapshot", () => {
    const computed = computeGameGoldensP1();
    for (const profileId of P1_GAME_PROFILES) {
      expect(computed[profileId], `${profileId} P1 drift`).toEqual(p1Goldens[profileId]);
    }
  });
});
