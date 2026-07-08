import {
  EXTRA_HIGH_INR,
  EXTRA_LOW_INR,
  REFERENCE_PREPAY_25_INR,
} from "../../lib/game/constants";
import type {
  GameActionProfile,
  GameProfileId,
  GameWarning,
} from "../../lib/game/types";
import { formatInr } from "../../lib/formatInr";

export type LegendCategory =
  | "players"
  | "profiles"
  | "borrower"
  | "lender"
  | "household"
  | "nature"
  | "warnings"
  | "columns";

export interface LegendEntry {
  code: string;
  label: string;
  meaning: string;
}

export const LEGEND_BY_CATEGORY: Record<LegendCategory, LegendEntry[]> = {
  players: [
    {
      code: "B",
      label: "Borrower",
      meaning: "You — prepayment and extra principal choices.",
    },
    {
      code: "L",
      label: "Lender",
      meaning: "Bank — prepayment fee rule (competitive games).",
    },
    {
      code: "H",
      label: "Household",
      meaning: "Co-decider — how surplus cash is split (loan vs equity).",
    },
    {
      code: "N",
      label: "Nature",
      meaning: "Exogenous shock — employment timing and PF routing.",
    },
  ],
  profiles: [
    {
      code: "GAME_BL_SIM_FEE",
      label: "Prepay vs fee",
      meaning: "Borrower and lender choose prepay level and fee at the same time.",
    },
    {
      code: "GAME_BL_SEQ_L_FEE",
      label: "Lender moves first",
      meaning: "Lender commits to a fee rule; borrower then picks prepay.",
    },
    {
      code: "GAME_BH_SIM_SPLIT",
      label: "Household split",
      meaning: "Compare equity blend, prepay-heavy, and aggressive prepay strategies.",
    },
    {
      code: "GAME_BH_COOP_PARETO",
      label: "Cooperative splits",
      meaning: "Custom 70/30 and 30/70 splits vs equity blend (Pareto-efficient set).",
    },
    {
      code: "GAME_BN_SEQ_N_UE",
      label: "Employment shock",
      meaning: "Nature reveals employed vs unemployment; borrower picks monthly extra.",
    },
    {
      code: "GAME_BN_SIM_UE_TIMING",
      label: "When unemployment hits",
      meaning: "Unemployment start month × PF route × optional lump prepay.",
    },
    {
      code: "GAME_BLH_SIM_FULL",
      label: "Borrower + lender + household",
      meaning: "Three-player simultaneous game — prepay, fee, and household split.",
    },
    {
      code: "GAME_BLN_SEQ_N_FEE",
      label: "Nature then lender fee",
      meaning: "Employment shock revealed first; lender sets fee; borrower prepays.",
    },
    {
      code: "GAME_BHN_STOCH_RUNWAY",
      label: "Stochastic runway",
      meaning: "Household split vs min-cash runway under employment uncertainty.",
    },
    {
      code: "GAME_BLHN_EXT_STRESS",
      label: "Extended stress",
      meaning: "Four-player stress test — borrower, lender, household, and nature.",
    },
    {
      code: "GAME_BL_SIM_RATE_BUMP",
      label: "Rate bump vs prepay",
      meaning: "Lender may hold or bump rate after lump prepay (bps input).",
    },
    {
      code: "GAME_BL_MIXED_FEE",
      label: "Mixed Nash fees",
      meaning: "2×2 borrower–lender game with mixed-strategy Nash equilibrium.",
    },
  ],
  borrower: [
    {
      code: "B_PREPAY_0",
      label: "No lump prepay",
      meaning: "No one-time prepayment at month 1.",
    },
    {
      code: "B_PREPAY_25",
      label: `Prepay ${formatInr(REFERENCE_PREPAY_25_INR)}`,
      meaning: "One-time prepayment of ₹25 lakh at month 1 (reference scenario).",
    },
    {
      code: "B_PREPAY_50",
      label: "Prepay 50% of cash",
      meaning: "Lump prepay equal to half of deployable cash on hand.",
    },
    {
      code: "B_PREPAY_100",
      label: "Prepay all deployable cash",
      meaning: "Use 100% of deployable cash for month-1 lump prepay.",
    },
    {
      code: "B_POL_TENURE",
      label: "Keep EMI",
      meaning: "After prepay, EMI stays the same; loan ends sooner (reduce tenure).",
    },
    {
      code: "B_POL_EMI",
      label: "Keep tenure",
      meaning: "After prepay, tenure unchanged; EMI is recalculated lower.",
    },
    {
      code: "B_EXTRA_0",
      label: "No monthly extra",
      meaning: "No recurring extra principal after each EMI.",
    },
    {
      code: "B_EXTRA_LOW",
      label: `${formatInr(EXTRA_LOW_INR)}/mo extra`,
      meaning: `Fixed ${formatInr(EXTRA_LOW_INR)} extra principal to loan each month.`,
    },
    {
      code: "B_EXTRA_HIGH",
      label: `${formatInr(EXTRA_HIGH_INR)}/mo extra`,
      meaning: `Fixed ${formatInr(EXTRA_HIGH_INR)} extra principal to loan each month.`,
    },
  ],
  lender: [
    {
      code: "L_FEE_0",
      label: "No prepay fee",
      meaning: "Lender charges ₹0 prepayment penalty.",
    },
    {
      code: "L_FEE_FLAT",
      label: "Flat prepay fee",
      meaning: "One flat fee (your “Prepayment fee” input) per lump prepay event.",
    },
    {
      code: "L_FEE_PCT",
      label: "Percent prepay fee",
      meaning: "Fee = percentage of prepay amount (default 1% in model).",
    },
    {
      code: "L_RATE_HOLD",
      label: "Hold rate",
      meaning: "Lender keeps the contractual interest rate after prepay.",
    },
    {
      code: "L_RATE_BUMP",
      label: "Bump rate",
      meaning: "Lender increases rate by the configured bps after lump prepay.",
    },
  ],
  household: [
    {
      code: "H_BLEND",
      label: "Equity blend",
      meaning: "40% deployable to prepay, 60% to equity; 60/40 split on monthly surplus.",
    },
    {
      code: "H_PREPAY",
      label: "Prepay heavy",
      meaning: "All deployable cash and surplus routed to loan prepayment.",
    },
    {
      code: "H_AGGR",
      label: "Aggressive prepay",
      meaning: "High % of take-home committed to loan (Strategies tab rules).",
    },
    {
      code: "H_CUSTOM_70_30",
      label: "70% loan / 30% equity",
      meaning: "Cooperative preset — majority to loan, minority to equity.",
    },
    {
      code: "H_CUSTOM_30_70",
      label: "30% loan / 70% equity",
      meaning: "Cooperative preset — minority to loan, majority to equity.",
    },
  ],
  nature: [
    {
      code: "N_EMPLOYED",
      label: "Employed",
      meaning: "No unemployment shock; standard loan path.",
    },
    {
      code: "N_UE_M1",
      label: "Unemployment at month 1",
      meaning: "Job loss starts at month 1; PF tranches follow §4.7 rules.",
    },
    {
      code: "N_UE_M12",
      label: "Unemployment at month 12",
      meaning: "Job loss starts at month 12.",
    },
    {
      code: "N_UE_M24",
      label: "Unemployment at month 24",
      meaning: "Job loss starts at month 24.",
    },
    {
      code: "N_PF_LOAN",
      label: "PF → loan",
      meaning: "Both PF tranches applied as loan prepayment (UE_PF_TO_LOAN style).",
    },
    {
      code: "N_PF_BRIDGE",
      label: "PF bridge",
      meaning: "Partial tranche 1 to loan; tranche 2 mostly to loan (liquidity bridge).",
    },
    {
      code: "N_PF_DELAY",
      label: "Delayed PF prepay",
      meaning: "No loan prepay from PF until month-12 tranche.",
    },
  ],
  warnings: [
    {
      code: "INSUFFICIENT_ASSETS",
      label: "Insufficient assets",
      meaning: "Funding mix requested more than labelled cash/gold/PF.",
    },
    {
      code: "NO_PURE_EQUILIBRIUM",
      label: "No pure equilibrium",
      meaning: "No stable pair where neither side wants to switch strategy.",
    },
    {
      code: "AMBIGUOUS_EQUILIBRIUM",
      label: "Multiple equilibria",
      meaning: "More than one stable outcome — review the full matrix.",
    },
  ],
  columns: [
    {
      code: "B (column)",
      label: "Borrower payoff",
      meaning: "Your score — default: interest saved minus prepayment fees (INR).",
    },
    {
      code: "L (column)",
      label: "Lender payoff",
      meaning: "Bank score — usually fee income (INR).",
    },
    {
      code: "H (column)",
      label: "Household payoff",
      meaning: "Shared household score (same metric as borrower in cooperative games).",
    },
  ],
};

const ACTION_LOOKUP = new Map<string, LegendEntry>(
  [
    ...LEGEND_BY_CATEGORY.borrower,
    ...LEGEND_BY_CATEGORY.lender,
    ...LEGEND_BY_CATEGORY.household,
    ...LEGEND_BY_CATEGORY.nature,
  ].map((e) => [e.code, e]),
);

const PROFILE_LOOKUP = new Map<string, LegendEntry>(
  LEGEND_BY_CATEGORY.profiles.map((e) => [e.code, e]),
);

const WARNING_LOOKUP = new Map<string, LegendEntry>(
  LEGEND_BY_CATEGORY.warnings.map((e) => [e.code, e]),
);

export function describeActionCode(code: string): LegendEntry | undefined {
  return ACTION_LOOKUP.get(code);
}

export function describeGameProfile(id: GameProfileId): LegendEntry | undefined {
  return PROFILE_LOOKUP.get(id);
}

export function describeWarning(code: GameWarning): LegendEntry | undefined {
  return WARNING_LOOKUP.get(code);
}

/** Human-readable action string for tables (falls back to raw code). */
export function formatProfileReadable(profile: GameActionProfile): string {
  const parts: string[] = [];
  const fields: Array<keyof GameActionProfile> = [
    "b_lump",
    "b_policy",
    "b_extra",
    "l_fee",
    "l_rate",
    "h_split",
    "n_employment",
    "n_pf_route",
  ];
  for (const key of fields) {
    const code = profile[key];
    if (!code) continue;
    const entry = describeActionCode(code);
    parts.push(entry?.label ?? code);
  }
  return parts.join(" · ") || "—";
}

export function formatProfileWithCodes(profile: GameActionProfile): {
  readable: string;
  codes: string;
} {
  const codes: string[] = [];
  const fields: Array<keyof GameActionProfile> = [
    "b_lump",
    "b_policy",
    "b_extra",
    "l_fee",
    "l_rate",
    "h_split",
    "n_employment",
    "n_pf_route",
  ];
  for (const key of fields) {
    const code = profile[key];
    if (code) codes.push(code);
  }
  return {
    readable: formatProfileReadable(profile),
    codes: codes.join(" · "),
  };
}

export const LEGEND_CATEGORY_TITLES: Record<LegendCategory, string> = {
  players: "Players",
  profiles: "Game profiles",
  borrower: "Borrower (B) actions",
  lender: "Lender (L) actions",
  household: "Household (H) actions",
  nature: "Nature (N) actions",
  warnings: "Warnings",
  columns: "Table columns",
};
