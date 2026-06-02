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
} from "./payoff";
import {
  collapseBlCells,
  deviationGainsForBorrower,
  findPureNashEquilibria,
  maxMinBorrowerCell,
  paretoEfficientCells,
  uniqueScenarioIds,
} from "./solver";
import type {
  BLumpAction,
  BPolicyAction,
  BExtraAction,
  GameActionProfile,
  GameResult,
  GameWarning,
  HSplitAction,
  LFeeAction,
  NEmploymentAction,
  NPfRouteAction,
  PayoffCell,
  PlayerId,
} from "./types";

function blCell(
  input: GameInput,
  lump: BLumpAction,
  policy: BPolicyAction,
  fee: LFeeAction,
  extra: BExtraAction = "B_EXTRA_0",
): PayoffCell {
  const lumpInr = resolveLumpInr(lump, input.cash_inr);
  const feeInr = prepaymentFeeInr(fee, lumpInr, input);
  const extraInr = resolveExtraInr(extra);
  const { totals, scenarioId } = runBlSchedule(input, lumpInr, policy, extraInr);
  const profile: GameActionProfile = {
    b_lump: lump,
    b_policy: lump === "B_PREPAY_0" ? undefined : policy,
    b_extra: extra,
    l_fee: fee,
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

export function runGameBlSimFee(input: GameInput): GameResult {
  const lumps: BLumpAction[] = ["B_PREPAY_0", "B_PREPAY_25", "B_PREPAY_50"];
  const policies: BPolicyAction[] = ["B_POL_TENURE", "B_POL_EMI"];
  const fees: LFeeAction[] = ["L_FEE_0", "L_FEE_FLAT"];
  const raw: PayoffCell[] = [];
  for (const lump of lumps) {
    for (const fee of fees) {
      if (lump === "B_PREPAY_0") {
        raw.push(blCell(input, lump, "B_POL_TENURE", fee));
      } else {
        for (const policy of policies) {
          raw.push(blCell(input, lump, policy, fee));
        }
      }
    }
  }
  const cells = collapseBlCells(raw);
  const players: PlayerId[] = ["B", "L"];
  const equilibria = findPureNashEquilibria(cells, players);
  const warnings: GameWarning[] = [];
  if (equilibria.length === 0) warnings.push("NO_PURE_EQUILIBRIUM");
  if (equilibria.length > 1) warnings.push("AMBIGUOUS_EQUILIBRIUM");

  const recommended = equilibria[0]?.action_profile;
  const deviation_gains = recommended
    ? deviationGainsForBorrower(cells, recommended)
    : [];

  return {
    game_profile_id: "GAME_BL_SIM_FEE",
    payoff_matrix: cells,
    equilibria,
    recommended_b_action: recommended,
    deviation_gains,
    warnings,
    underlying_scenario_ids: uniqueScenarioIds(cells),
  };
}

export function runGameBlSeqLFee(input: GameInput): GameResult {
  const lumps: BLumpAction[] = ["B_PREPAY_0", "B_PREPAY_25", "B_PREPAY_50"];
  const policies: BPolicyAction[] = ["B_POL_TENURE", "B_POL_EMI"];
  const fees: LFeeAction[] = ["L_FEE_0", "L_FEE_FLAT", "L_FEE_PCT"];

  const subgameRoots: PayoffCell[] = [];

  for (const fee of fees) {
    let bestB: PayoffCell | undefined;
    for (const lump of lumps) {
      const policyList =
        lump === "B_PREPAY_0" ? (["B_POL_TENURE"] as BPolicyAction[]) : policies;
      for (const policy of policyList) {
        const cell = blCell(input, lump, policy, fee);
        if (!bestB || (cell.payoffs.B ?? -Infinity) > (bestB.payoffs.B ?? -Infinity)) {
          bestB = cell;
        }
      }
    }
    if (bestB) subgameRoots.push(bestB);
  }

  let lenderPick = subgameRoots[0];
  for (const cell of subgameRoots) {
    if ((cell.payoffs.L ?? -Infinity) > (lenderPick?.payoffs.L ?? -Infinity)) {
      lenderPick = cell;
    }
  }

  const equilibria = lenderPick
    ? [
        {
          action_profile: lenderPick.action_profile,
          payoffs: lenderPick.payoffs,
          is_pure: true,
        },
      ]
    : [];

  return {
    game_profile_id: "GAME_BL_SEQ_L_FEE",
    payoff_matrix: subgameRoots,
    equilibria,
    recommended_b_action: lenderPick?.action_profile,
    deviation_gains: [],
    warnings: [],
    underlying_scenario_ids: uniqueScenarioIds(subgameRoots),
  };
}

export function runGameBhSimSplit(input: GameInput): GameResult {
  const splits: HSplitAction[] = ["H_BLEND", "H_PREPAY", "H_AGGR"];
  const cells: PayoffCell[] = splits.map((h_split) => {
    const { payoff, scenarioId } = borrowerPayoffBh(input, h_split, input.payoff_metric);
    const profile: GameActionProfile = { h_split };
    return {
      action_profile: profile,
      cell_key: cellKey(profile),
      underlying_scenario_id: scenarioId,
      payoffs: { B: payoff, H: payoff },
    };
  });

  const frontier = paretoEfficientCells(cells, true);

  return {
    game_profile_id: "GAME_BH_SIM_SPLIT",
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

export function runGameBhCoopPareto(input: GameInput): GameResult {
  const splits: HSplitAction[] = ["H_CUSTOM_70_30", "H_CUSTOM_30_70", "H_BLEND"];
  const cells: PayoffCell[] = splits.map((h_split) => {
    const { payoff, scenarioId } = borrowerPayoffBh(
      input,
      h_split,
      input.payoff_metric === "NET_WORTH_HORIZON"
        ? "NET_WORTH_HORIZON"
        : "NET_WORTH_HORIZON",
    );
    const profile: GameActionProfile = { h_split };
    return {
      action_profile: profile,
      cell_key: cellKey(profile),
      underlying_scenario_id: scenarioId,
      payoffs: { B: payoff, H: payoff },
    };
  });

  const frontier = paretoEfficientCells(cells, true);

  return {
    game_profile_id: "GAME_BH_COOP_PARETO",
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

export function runGameBnSeqNUe(input: GameInput): GameResult {
  const extras: BExtraAction[] = ["B_EXTRA_0", "B_EXTRA_HIGH"];
  const employments: NEmploymentAction[] = ["N_EMPLOYED", "N_UE_M1"];
  const routes: NPfRouteAction[] = ["N_PF_LOAN", "N_PF_BRIDGE"];
  const cells: PayoffCell[] = [];

  for (const b_extra of extras) {
    for (const n_employment of employments) {
      const routeList =
        n_employment === "N_EMPLOYED" ? (["N_PF_LOAN"] as NPfRouteAction[]) : routes;
      for (const n_pf_route of routeList) {
        const { payoff, scenarioId } = borrowerPayoffBn(
          input,
          input.payoff_metric,
          n_employment,
          n_pf_route,
          "B_PREPAY_0",
          b_extra,
        );
        const profile: GameActionProfile = {
          b_extra,
          n_employment,
          n_pf_route,
        };
        cells.push({
          action_profile: profile,
          cell_key: cellKey(profile),
          underlying_scenario_id: scenarioId,
          payoffs: { B: payoff },
        });
      }
    }
  }

  const best = maxMinBorrowerCell(cells);

  return {
    game_profile_id: "GAME_BN_SEQ_N_UE",
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

export function runGameBnSimUeTiming(input: GameInput): GameResult {
  const lumps: BLumpAction[] = ["B_PREPAY_0", "B_PREPAY_25"];
  const employments: NEmploymentAction[] = ["N_UE_M1", "N_UE_M12", "N_UE_M24"];
  const routes: NPfRouteAction[] = ["N_PF_LOAN", "N_PF_BRIDGE"];
  const cells: PayoffCell[] = [];

  for (const b_lump of lumps) {
    for (const n_employment of employments) {
      for (const n_pf_route of routes) {
        const { payoff, scenarioId } = borrowerPayoffBn(
          input,
          input.payoff_metric,
          n_employment,
          n_pf_route,
          b_lump,
          "B_EXTRA_0",
        );
        const profile: GameActionProfile = {
          b_lump,
          n_employment,
          n_pf_route,
        };
        cells.push({
          action_profile: profile,
          cell_key: cellKey(profile),
          underlying_scenario_id: scenarioId,
          payoffs: { B: payoff },
        });
      }
    }
  }

  const best = maxMinBorrowerCell(cells);

  return {
    game_profile_id: "GAME_BN_SIM_UE_TIMING",
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
