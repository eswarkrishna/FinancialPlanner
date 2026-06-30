import { describe, expect, it } from "vitest";
import { makeReferenceGameInput } from "../../test/factories/gameFactory";
import { runGame, runGameByProfileId } from "./runGame";

describe("§4.13 game theory (P0)", () => {
  it("GAME_BL_SIM_FEE produces 10 collapsed payoff cells", () => {
    const result = runGame(
      makeReferenceGameInput({ game_profile_id: "GAME_BL_SIM_FEE" }),
    );
    expect(result.payoff_matrix).toHaveLength(10);
    expect(result.underlying_scenario_ids.length).toBeGreaterThan(0);
  });

  it("when L_FEE_0, borrower best response maximises interest saved", () => {
    const result = runGame(
      makeReferenceGameInput({
        game_profile_id: "GAME_BL_SIM_FEE",
        prepayment_fee_inr: 25_000,
      }),
    );
    const noFeeCells = result.payoff_matrix.filter(
      (c) => c.action_profile.l_fee === "L_FEE_0",
    );
    const best = noFeeCells.reduce((a, c) =>
      (c.payoffs.B ?? -Infinity) > (a.payoffs.B ?? -Infinity) ? c : a,
    );
    expect(best.action_profile.b_lump).not.toBe("B_PREPAY_0");
    expect(best.payoffs.B).toBeGreaterThan(0);
  });

  it("GAME_BL_SEQ_L_FEE returns subgame-perfect lender pick", () => {
    const result = runGameByProfileId("GAME_BL_SEQ_L_FEE", makeReferenceGameInput());
    expect(result.payoff_matrix.length).toBe(3);
    expect(result.equilibria).toHaveLength(1);
    expect(result.recommended_b_action).toBeDefined();
  });

  it("GAME_BH_SIM_SPLIT runs three household strategies", () => {
    const result = runGameByProfileId("GAME_BH_SIM_SPLIT", makeReferenceGameInput());
    expect(result.payoff_matrix).toHaveLength(3);
    expect(result.equilibria.length).toBeGreaterThan(0);
  });

  it("GAME_BN_SIM_UE_TIMING has 12 cells", () => {
    const result = runGameByProfileId("GAME_BN_SIM_UE_TIMING", makeReferenceGameInput());
    expect(result.payoff_matrix).toHaveLength(12);
    expect(result.recommended_b_action).toBeDefined();
  });

  it("GAME_BN_SEQ_N_UE max-min recommends an action", () => {
    const result = runGameByProfileId("GAME_BN_SEQ_N_UE", makeReferenceGameInput());
    expect(result.payoff_matrix.length).toBeGreaterThan(0);
    expect(result.recommended_b_action?.b_extra).toBeDefined();
  });

  it("oracle purity: payoffs change when principal changes", () => {
    const a = runGame(makeReferenceGameInput({ principal_inr: 5_000_000 }));
    const b = runGame(makeReferenceGameInput({ principal_inr: 4_000_000 }));
    const payA = a.payoff_matrix.map((c) => c.payoffs.B ?? 0).join(",");
    const payB = b.payoff_matrix.map((c) => c.payoffs.B ?? 0).join(",");
    expect(payA).not.toBe(payB);
  });
});
