/** Spec §4.13.8 Tier P1 — extended game profiles (v1.3). */

import type { GameInput } from "./gameInput";
import {
  borrowerPayoffBh,
  borrowerPayoffBl,
  borrowerPayoffBn,
  cellKey,
  lenderPayoffBl,
  prepaymentFeeInr,
  resolveExtraInr,
  resolveLumpInr,
  runBlSchedule,
  runBlScheduleWithRateBump,
} from "./payoff";
import {
  collapseBlCells,
  findMixedNash2x2,
  findPureNashEquilibria,
  maxMinBorrowerCell,
  paretoEfficientCells,
  subgamePerfectBlSeqLFee,
  uniqueScenarioIds,
} from "./solver";
import type {
  BLumpAction,
  BPolicyAction,
  BExtraAction,
  GameActionProfile,
  GameResult,
  HSplitAction,
  LFeeAction,
  LRateAction,
  NEmploymentAction,
  NPfRouteAction,
  PayoffCell,
} from "./types";

function blCellWithRate(
  input: GameInput,
  lump: BLumpAction,
  policy: BPolicyAction,
  fee: LFeeAction,
  rate: LRateAction,
  extra: BExtraAction = "B_EXTRA_0",
): PayoffCell {
  const lumpInr = resolveLumpInr(lump, input);
  const feeInr = prepaymentFeeInr(fee, lumpInr, input);
  const extraInr = resolveExtraInr(extra);
  const bumpBps = input.lender_rate_bump_bps ?? 50;
  const { totals, scenarioId } =
    rate === "L_RATE_BUMP" && lumpInr > 0
      ? runBlScheduleWithRateBump(input, lumpInr, policy, extraInr, bumpBps)
      : runBlSchedule(input, lumpInr, policy, extraInr);
  const profile: GameActionProfile = {
    b_lump: lump,
    b_policy: lump === "B_PREPAY_0" ? undefined : policy,
    b_extra: extra,
    l_fee: fee,
    l_rate: rate,
  };
  return {
    action_profile: profile,
    cell_key: cellKey(profile),
    underlying_scenario_id: scenarioId,
    payoffs: {
      B: borrowerPayoffBl(input, input.payoff_metric, lumpInr, policy, extraInr, feeInr),
      L: lenderPayoffBl(input.lender_objective, feeInr, totals),
    },
  };
}

/** P1 — fee + household split (reduced grid). */
export function runGameBlhSimFull(input: GameInput): GameResult {
  const fees: LFeeAction[] = ["L_FEE_0", "L_FEE_FLAT"];
  const splits: HSplitAction[] = ["H_BLEND", "H_PREPAY", "H_AGGR"];
  const cells: PayoffCell[] = [];

  for (const h_split of splits) {
    for (const l_fee of fees) {
      const { payoff, scenarioId } = borrowerPayoffBh(
        input,
        h_split,
        input.payoff_metric,
      );
      const lumpInr = resolveLumpInr("B_PREPAY_25", input);
      const feeInr = prepaymentFeeInr(l_fee, lumpInr, input);
      const profile: GameActionProfile = { h_split, l_fee, b_lump: "B_PREPAY_25" };
      cells.push({
        action_profile: profile,
        cell_key: cellKey(profile),
        underlying_scenario_id: scenarioId,
        payoffs: {
          B: payoff - feeInr,
          L: feeInr,
        },
      });
    }
  }

  const frontier = paretoEfficientCells(cells, true);
  return {
    game_profile_id: "GAME_BLH_SIM_FULL",
    payoff_matrix: cells,
    equilibria: frontier.map((c) => ({
      action_profile: c.action_profile,
      payoffs: c.payoffs,
      is_pure: true,
    })),
    recommended_b_action: frontier[0]?.action_profile,
    deviation_gains: [],
    warnings: [],
    underlying_scenario_ids: uniqueScenarioIds(cells),
  };
}

/** P1 — nature reveals UE timing, then lender fee, then borrower prepay. */
export function runGameBlnSeqNFee(input: GameInput): GameResult {
  const employments: NEmploymentAction[] = ["N_EMPLOYED", "N_UE_M1"];
  const fees: LFeeAction[] = ["L_FEE_0", "L_FEE_FLAT"];
  const lumps: BLumpAction[] = ["B_PREPAY_0", "B_PREPAY_25"];
  const cells: PayoffCell[] = [];

  for (const n_employment of employments) {
    for (const l_fee of fees) {
      for (const b_lump of lumps) {
        const { payoff, scenarioId } = borrowerPayoffBn(
          input,
          input.payoff_metric,
          n_employment,
          "N_PF_LOAN",
          b_lump,
          "B_EXTRA_0",
        );
        const lumpInr = resolveLumpInr(b_lump, input);
        const feeInr = prepaymentFeeInr(l_fee, lumpInr, input);
        const profile: GameActionProfile = { n_employment, l_fee, b_lump };
        cells.push({
          action_profile: profile,
          cell_key: cellKey(profile),
          underlying_scenario_id: scenarioId,
          payoffs: { B: payoff - feeInr, L: feeInr },
        });
      }
    }
  }

  const best = subgamePerfectBlSeqLFee(cells, lumps, fees, employments);
  return {
    game_profile_id: "GAME_BLN_SEQ_N_FEE",
    payoff_matrix: cells,
    equilibria: best ? [{ action_profile: best, payoffs: {}, is_pure: true }] : [],
    recommended_b_action: best,
    deviation_gains: [],
    warnings: [],
    underlying_scenario_ids: uniqueScenarioIds(cells),
  };
}

/** P1 — max-min cash runway with household split vs unemployment. */
export function runGameBhnStochRunway(input: GameInput): GameResult {
  const splits: HSplitAction[] = ["H_BLEND", "H_PREPAY"];
  const employments: NEmploymentAction[] = ["N_EMPLOYED", "N_UE_M1"];
  const routes: NPfRouteAction[] = ["N_PF_BRIDGE", "N_PF_LOAN"];
  const cells: PayoffCell[] = [];

  for (const h_split of splits) {
    for (const n_employment of employments) {
      for (const n_pf_route of routes) {
        if (n_employment === "N_EMPLOYED") {
          const { payoff, scenarioId } = borrowerPayoffBh(
            input,
            h_split,
            "MIN_CASH_RUNWAY",
          );
          const profile: GameActionProfile = { h_split, n_employment, b_lump: "B_PREPAY_0" };
          cells.push({
            action_profile: profile,
            cell_key: cellKey(profile),
            underlying_scenario_id: scenarioId,
            payoffs: { B: payoff, H: payoff },
          });
        } else {
          const { payoff, scenarioId } = borrowerPayoffBn(
            input,
            "MIN_CASH_RUNWAY",
            n_employment,
            n_pf_route,
            "B_PREPAY_0",
            "B_EXTRA_0",
          );
          const profile: GameActionProfile = {
            h_split,
            n_employment,
            n_pf_route,
            b_lump: "B_PREPAY_0",
          };
          cells.push({
            action_profile: profile,
            cell_key: cellKey(profile),
            underlying_scenario_id: scenarioId,
            payoffs: { B: payoff, H: payoff },
          });
        }
      }
    }
  }

  const best = maxMinBorrowerCell(cells);
  return {
    game_profile_id: "GAME_BHN_STOCH_RUNWAY",
    payoff_matrix: cells,
    equilibria: best
      ? [{ action_profile: best.action_profile, payoffs: best.payoffs, is_pure: true }]
      : [],
    recommended_b_action: best?.action_profile,
    deviation_gains: [],
    warnings: [],
    underlying_scenario_ids: uniqueScenarioIds(cells),
  };
}

/** P1 — full stress stack (reduced action grid). */
export function runGameBlhnExtStress(input: GameInput): GameResult {
  const lumps: BLumpAction[] = ["B_PREPAY_0", "B_PREPAY_25"];
  const fees: LFeeAction[] = ["L_FEE_0", "L_FEE_FLAT"];
  const splits: HSplitAction[] = ["H_BLEND", "H_PREPAY"];
  const employments: NEmploymentAction[] = ["N_EMPLOYED", "N_UE_M1"];
  const cells: PayoffCell[] = [];

  for (const b_lump of lumps) {
    for (const l_fee of fees) {
      for (const h_split of splits) {
        for (const n_employment of employments) {
          const outcome =
            n_employment === "N_EMPLOYED"
              ? borrowerPayoffBh(input, h_split, input.payoff_metric)
              : borrowerPayoffBn(
                  input,
                  input.payoff_metric,
                  n_employment,
                  "N_PF_BRIDGE",
                  b_lump,
                  "B_EXTRA_0",
                );
          const payoff = outcome.payoff;
          const scenarioId = outcome.scenarioId;
          const lumpInr = resolveLumpInr(b_lump, input);
          const feeInr = prepaymentFeeInr(l_fee, lumpInr, input);
          const profile: GameActionProfile = {
            b_lump,
            b_policy: b_lump === "B_PREPAY_0" ? undefined : "B_POL_TENURE",
            l_fee,
            h_split,
            n_employment,
          };
          cells.push({
            action_profile: profile,
            cell_key: cellKey(profile),
            underlying_scenario_id: scenarioId,
            payoffs: {
              B: payoff - feeInr,
              L: feeInr,
            },
          });
        }
      }
    }
  }

  const best = maxMinBorrowerCell(cells);
  return {
    game_profile_id: "GAME_BLHN_EXT_STRESS",
    payoff_matrix: cells,
    equilibria: best
      ? [{ action_profile: best.action_profile, payoffs: best.payoffs, is_pure: true }]
      : [],
    recommended_b_action: best?.action_profile,
    deviation_gains: [],
    warnings: [],
    underlying_scenario_ids: uniqueScenarioIds(cells),
  };
}

/** P1 — prepay may trigger lender rate bump. */
export function runGameBlSimRateBump(input: GameInput): GameResult {
  const lumps: BLumpAction[] = ["B_PREPAY_0", "B_PREPAY_25", "B_PREPAY_50"];
  const policies: BPolicyAction[] = ["B_POL_TENURE", "B_POL_EMI"];
  const rates: LRateAction[] = ["L_RATE_HOLD", "L_RATE_BUMP"];
  const raw: PayoffCell[] = [];
  for (const lump of lumps) {
    for (const rate of rates) {
      if (lump === "B_PREPAY_0") {
        raw.push(blCellWithRate(input, lump, "B_POL_TENURE", "L_FEE_0", rate));
      } else {
        for (const policy of policies) {
          raw.push(blCellWithRate(input, lump, policy, "L_FEE_0", rate));
        }
      }
    }
  }
  const cells = collapseBlCells(raw);
  const equilibria = findPureNashEquilibria(cells, ["B", "L"]);
  const recommended = equilibria[0]?.action_profile ?? cells[0]?.action_profile;
  return {
    game_profile_id: "GAME_BL_SIM_RATE_BUMP",
    payoff_matrix: cells,
    equilibria,
    recommended_b_action: recommended,
    deviation_gains: [],
    warnings: equilibria.length === 0 ? ["NO_PURE_EQUILIBRIUM"] : [],
    underlying_scenario_ids: uniqueScenarioIds(cells),
  };
}

/** P1 — mixed strategy Nash on 2×2 fee game (lump 0 vs 25 × fee 0 vs flat). */
export function runGameBlMixedFee(input: GameInput): GameResult {
  const lumps: BLumpAction[] = ["B_PREPAY_0", "B_PREPAY_25"];
  const fees: LFeeAction[] = ["L_FEE_0", "L_FEE_FLAT"];
  const cells: PayoffCell[] = [];
  for (const lump of lumps) {
    for (const fee of fees) {
      cells.push(blCellWithRate(input, lump, "B_POL_TENURE", fee, "L_RATE_HOLD"));
    }
  }
  const mixed = findMixedNash2x2(cells, "B", "L");
  return {
    game_profile_id: "GAME_BL_MIXED_FEE",
    payoff_matrix: cells,
    equilibria: mixed.equilibria,
    recommended_b_action: mixed.recommended_b,
    deviation_gains: [],
    warnings: mixed.warnings,
    underlying_scenario_ids: uniqueScenarioIds(cells),
  };
}
