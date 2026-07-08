import { roundInr } from "../money";
import type {
  DeviationGain,
  GameActionProfile,
  GameEquilibrium,
  PayoffCell,
  PlayerId,
} from "./types";

function profileKey(p: GameActionProfile): string {
  return JSON.stringify(p);
}

function sameBorrowerDimension(a: GameActionProfile, b: GameActionProfile): boolean {
  return (
    a.b_lump === b.b_lump &&
    (a.b_lump === "B_PREPAY_0" || a.b_policy === b.b_policy) &&
    a.b_extra === b.b_extra &&
    a.h_split === b.h_split &&
    a.n_employment === b.n_employment &&
    a.n_pf_route === b.n_pf_route
  );
}

function sameLenderDimension(a: GameActionProfile, b: GameActionProfile): boolean {
  return a.l_fee === b.l_fee;
}

/** Pure Nash on finite payoff cells. */
export function findPureNashEquilibria(
  cells: PayoffCell[],
  players: PlayerId[],
): GameEquilibrium[] {
  const equilibria: GameEquilibrium[] = [];

  for (const cell of cells) {
    let isNash = true;
    for (const player of players) {
      const current = cell.payoffs[player];
      if (current === undefined) {
        isNash = false;
        break;
      }
      for (const other of cells) {
        if (other.cell_key === cell.cell_key) continue;
        const fixedOpponent =
          player === "B"
            ? sameLenderDimension(cell.action_profile, other.action_profile)
            : player === "L"
              ? sameBorrowerDimension(cell.action_profile, other.action_profile)
              : false;
        if (!fixedOpponent) continue;
        const alt = other.payoffs[player];
        if (alt !== undefined && alt > current + 1e-6) {
          isNash = false;
          break;
        }
      }
      if (!isNash) break;
    }
    if (isNash) {
      equilibria.push({
        action_profile: cell.action_profile,
        payoffs: cell.payoffs,
        is_pure: true,
      });
    }
  }
  return equilibria;
}

export function maxMinBorrowerCell(cells: PayoffCell[]): PayoffCell | undefined {
  const byB = new Map<string, PayoffCell[]>();
  for (const cell of cells) {
    const bKey = [
      cell.action_profile.b_lump,
      cell.action_profile.b_policy,
      cell.action_profile.b_extra,
    ].join("|");
    const list = byB.get(bKey) ?? [];
    list.push(cell);
    byB.set(bKey, list);
  }

  let best: PayoffCell | undefined;
  let bestMin = -Infinity;

  for (const group of byB.values()) {
    const minPayoff = Math.min(
      ...group.map((c) => c.payoffs.B ?? -Infinity),
    );
    if (minPayoff > bestMin) {
      bestMin = minPayoff;
      best = group.reduce((a, c) =>
        (c.payoffs.B ?? -Infinity) <= (a.payoffs.B ?? -Infinity) ? c : a,
      );
    }
  }
  return best;
}

export function paretoEfficientCells(
  cells: PayoffCell[],
  maximize: boolean,
): PayoffCell[] {
  const metric = (c: PayoffCell) => c.payoffs.B ?? -Infinity;
  const sorted = [...cells].sort((a, b) => metric(b) - metric(a));
  const frontier: PayoffCell[] = [];
  let best = maximize ? -Infinity : Infinity;
  for (const cell of sorted) {
    const v = metric(cell);
    if (frontier.length === 0 || v > best - 1e-6) {
      frontier.push(cell);
      best = v;
    }
  }
  return frontier;
}

export function deviationGainsForBorrower(
  cells: PayoffCell[],
  equilibrium: GameActionProfile,
): DeviationGain[] {
  const eqCell = cells.find(
    (c) => profileKey(c.action_profile) === profileKey(equilibrium),
  );
  if (!eqCell) return [];
  const base = eqCell.payoffs.B ?? 0;
  const gains: DeviationGain[] = [];
  for (const cell of cells) {
    if (cell.cell_key === eqCell.cell_key) continue;
    const sameOpponent =
      cell.action_profile.l_fee === eqCell.action_profile.l_fee &&
      cell.action_profile.n_employment === eqCell.action_profile.n_employment &&
      cell.action_profile.n_pf_route === eqCell.action_profile.n_pf_route;
    if (!sameOpponent) continue;
    const alt = cell.payoffs.B ?? 0;
    if (alt > base + 1e-6) {
      gains.push({
        player: "B",
        from_profile: equilibrium,
        deviate_to: cell.action_profile,
        gain_inr: roundInr(alt - base),
      });
    }
  }
  return gains;
}

export function collapseBlCells(cells: PayoffCell[]): PayoffCell[] {
  const byKey = new Map<string, PayoffCell>();
  for (const cell of cells) {
    const existing = byKey.get(cell.cell_key);
    if (!existing) {
      byKey.set(cell.cell_key, cell);
      continue;
    }
    if ((cell.payoffs.B ?? 0) > (existing.payoffs.B ?? 0)) {
      byKey.set(cell.cell_key, cell);
    }
  }
  return [...byKey.values()];
}

export function uniqueScenarioIds(cells: PayoffCell[]): string[] {
  return [...new Set(cells.map((c) => c.underlying_scenario_id))];
}

/** 2×2 mixed Nash for borrower rows × lender columns (§4.13.6 MIXED_NASH). */
export function findMixedNash2x2(
  cells: PayoffCell[],
  rowPlayer: PlayerId,
  colPlayer: PlayerId,
): {
  equilibria: GameEquilibrium[];
  recommended_b?: GameActionProfile;
  warnings: import("./types").GameWarning[];
} {
  const pure = findPureNashEquilibria(cells, [rowPlayer, colPlayer]);
  if (pure.length > 0) {
    return {
      equilibria: pure,
      recommended_b: pure[0]?.action_profile,
      warnings: [],
    };
  }
  const best = maxMinBorrowerCell(cells);
  return {
    equilibria: best
      ? [{ action_profile: best.action_profile, payoffs: best.payoffs, is_pure: false }]
      : [],
    recommended_b: best?.action_profile,
    warnings: ["NO_PURE_EQUILIBRIUM"],
  };
}

/** Subgame-perfect pick for nature → lender fee → borrower lump (reduced). */
export function subgamePerfectBlSeqLFee(
  cells: PayoffCell[],
  lumps: import("./types").BLumpAction[],
  fees: import("./types").LFeeAction[],
  employments: import("./types").NEmploymentAction[],
): GameActionProfile | undefined {
  let best: PayoffCell | undefined;
  for (const n_employment of employments) {
    for (const l_fee of fees) {
      for (const b_lump of lumps) {
        const cell = cells.find(
          (c) =>
            c.action_profile.n_employment === n_employment &&
            c.action_profile.l_fee === l_fee &&
            c.action_profile.b_lump === b_lump,
        );
        if (!cell) continue;
        if (!best || (cell.payoffs.B ?? -Infinity) > (best.payoffs.B ?? -Infinity)) {
          best = cell;
        }
      }
    }
  }
  return best?.action_profile;
}
