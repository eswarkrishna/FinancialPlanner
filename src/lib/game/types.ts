/** Spec §4.13 — strategic interaction types. */

export type PlayerId = "B" | "L" | "H" | "N";

export type GameProfileId =
  | "GAME_BL_SIM_FEE"
  | "GAME_BL_SEQ_L_FEE"
  | "GAME_BH_SIM_SPLIT"
  | "GAME_BH_COOP_PARETO"
  | "GAME_BN_SEQ_N_UE"
  | "GAME_BN_SIM_UE_TIMING"
  | "GAME_BLH_SIM_FULL"
  | "GAME_BLN_SEQ_N_FEE"
  | "GAME_BHN_STOCH_RUNWAY"
  | "GAME_BLHN_EXT_STRESS"
  | "GAME_BL_SIM_RATE_BUMP"
  | "GAME_BL_MIXED_FEE";

export type PayoffMetric =
  | "MINUS_TOTAL_INTEREST"
  | "MINUS_TOTAL_OUTFLOW"
  | "NET_WORTH_HORIZON"
  | "INTEREST_SAVED_MINUS_FEES"
  | "MIN_CASH_RUNWAY";

export type LenderObjective = "L_FEE_INCOME" | "L_INTEREST_INCOME";

export type BLumpAction = "B_PREPAY_0" | "B_PREPAY_25" | "B_PREPAY_50" | "B_PREPAY_100";

export type BPolicyAction = "B_POL_TENURE" | "B_POL_EMI";

export type BExtraAction = "B_EXTRA_0" | "B_EXTRA_LOW" | "B_EXTRA_HIGH";

export type LFeeAction = "L_FEE_0" | "L_FEE_FLAT" | "L_FEE_PCT";

export type LRateAction = "L_RATE_HOLD" | "L_RATE_BUMP";

export type HSplitAction =
  | "H_BLEND"
  | "H_PREPAY"
  | "H_AGGR"
  | "H_CUSTOM_70_30"
  | "H_CUSTOM_30_70";

export type NEmploymentAction = "N_EMPLOYED" | "N_UE_M1" | "N_UE_M12" | "N_UE_M24";

export type NPfRouteAction = "N_PF_LOAN" | "N_PF_BRIDGE" | "N_PF_DELAY";

export type GameWarning =
  | "INSUFFICIENT_ASSETS"
  | "NO_PURE_EQUILIBRIUM"
  | "AMBIGUOUS_EQUILIBRIUM";

export interface GameActionProfile {
  b_lump?: BLumpAction;
  b_policy?: BPolicyAction;
  b_extra?: BExtraAction;
  l_fee?: LFeeAction;
  l_rate?: LRateAction;
  h_split?: HSplitAction;
  n_employment?: NEmploymentAction;
  n_pf_route?: NPfRouteAction;
}

export interface PayoffCell {
  action_profile: GameActionProfile;
  payoffs: Partial<Record<PlayerId, number>>;
  /** Collapsed key for duplicate lump=0 policies. */
  cell_key: string;
  underlying_scenario_id: string;
}

export interface DeviationGain {
  player: PlayerId;
  from_profile: GameActionProfile;
  deviate_to: GameActionProfile;
  gain_inr: number;
}

export interface GameEquilibrium {
  action_profile: GameActionProfile;
  payoffs: Partial<Record<PlayerId, number>>;
  is_pure: boolean;
}

export interface GameResult {
  game_profile_id: GameProfileId;
  payoff_matrix: PayoffCell[];
  equilibria: GameEquilibrium[];
  recommended_b_action?: GameActionProfile;
  deviation_gains: DeviationGain[];
  warnings: GameWarning[];
  underlying_scenario_ids: string[];
}
