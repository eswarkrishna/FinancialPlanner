/** Spec §4.13.3 — default action level amounts. */

export const REFERENCE_PREPAY_25_INR = 2_500_000;

export const EXTRA_LOW_INR = 10_000;

export const EXTRA_HIGH_INR = 50_000;

export const DEFAULT_PREPAYMENT_FEE_INR = 25_000;

export const DEFAULT_PREPAYMENT_FEE_PCT = 1;

export const P0_GAME_PROFILES = [
  "GAME_BL_SIM_FEE",
  "GAME_BL_SEQ_L_FEE",
  "GAME_BH_SIM_SPLIT",
  "GAME_BH_COOP_PARETO",
  "GAME_BN_SEQ_N_UE",
  "GAME_BN_SIM_UE_TIMING",
] as const;

export const P1_GAME_PROFILES = [
  "GAME_BLH_SIM_FULL",
  "GAME_BLN_SEQ_N_FEE",
  "GAME_BHN_STOCH_RUNWAY",
  "GAME_BLHN_EXT_STRESS",
  "GAME_BL_SIM_RATE_BUMP",
  "GAME_BL_MIXED_FEE",
] as const;

export const ALL_GAME_PROFILES = [...P0_GAME_PROFILES, ...P1_GAME_PROFILES] as const;
