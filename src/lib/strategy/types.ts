/** Spec §4.12.2 — three named allocation strategies. */
export type StrategyId =
  | "STRATEGY_EQUITY_BLEND"
  | "STRATEGY_PREPAY_HEAVY"
  | "STRATEGY_AGGRESSIVE_PREPAY";

/** Spec §6 — household + strategy inputs. */
export interface StrategyInputs {
  principal_inr: number;
  annual_interest_rate: number;
  tenure_months: number;
  cash_inr: number;
  pf_corpus_inr: number;
  pf_annual_interest_rate_pct: number;
  monthly_pf_addition_inr: number;
  monthly_take_home_inr: number;
  monthly_living_expense_inr: number;
  extra_monthly_income_inr: number;
  extra_income_post_tax: boolean;
  marginal_tax_rate_pct: number;
  emergency_months_buffer: number;
  expected_equity_return_pct: number;
  horizon_months: number;
  repayment_pct_of_take_home?: number;
  /** Locale-aware subsistence floor for BELOW_SUBSISTENCE warning. */
  subsistence_floor_inr?: number;
  /** SPEC-US §4.12 — long-term cap gains rate on brokerage gain (default 15% US, 12.5% IN). */
  ltcg_rate_pct?: number;
  /** Annual LTCG exemption (default ₹1.25L IN; 0 US). */
  ltcg_exemption_inr?: number;
  /** SPEC-UK §4.12 — ISA annual allowance (GBP stored in locale-neutral field). */
  isa_annual_allowance_inr?: number;
  /** SPEC-UK §4.1 — ERC overpayment allowance (%/yr). */
  erc_overpayment_allowance_pct?: number;
  /** SPEC-UK §4.1 — ERC on excess prepay (%). */
  erc_pct?: number;
  /** SPEC-UK §4.12 — pension pot projection return (%). */
  pension_annual_return_pct?: number;
}

/** Spec §4.12.4 — per-strategy KPIs surfaced in the comparison row. */
export interface StrategyResult {
  strategy_id: StrategyId;
  loan_close_month: number;
  total_interest_inr: number;
  interest_saved_vs_base_inr: number;
  one_time_prepay_inr: number;
  monthly_extra_principal_inr: number;
  monthly_sip_inr: number;
  equity_lump_inr: number;
  equity_corpus_at_horizon_inr: number;
  equity_corpus_at_horizon_post_tax_inr: number;
  pf_corpus_at_horizon_inr: number;
  cash_buffer_remaining_inr: number;
  loan_balance_at_horizon_inr: number;
  net_worth_at_horizon_inr: number;
  min_living_budget_inr: number;
  warnings: StrategyWarning[];
  /** SPEC-UK §4.12.3 — total ERC fees over horizon. */
  erc_fees_inr?: number;
}

/** Spec §9 — warning codes produced by the strategy planner. */
export type StrategyWarning =
  | "EMERGENCY_FUND_SHORTFALL"
  | "FRAGILE_CASH_FLOW"
  | "BELOW_SUBSISTENCE"
  | "AGGRESSIVE_PCT_INVALID"
  | "HORIZON_TOO_SHORT"
  | "TAX_SIMPLIFIED"
  | "ERC_ALLOWANCE_EXCEEDED";

/** Spec §4.12.6 — three take-home tier presets surfaced in the UI. */
export interface StrategyTierPreset {
  id: "tier_a" | "tier_b" | "tier_c";
  label: string;
  monthly_take_home_inr: number;
}

export const STRATEGY_TIER_PRESETS: readonly StrategyTierPreset[] = [
  { id: "tier_a", label: "Tier A — ₹3L take-home", monthly_take_home_inr: 300_000 },
  { id: "tier_b", label: "Tier B — ₹2L take-home", monthly_take_home_inr: 200_000 },
  { id: "tier_c", label: "Tier C — ₹1L take-home", monthly_take_home_inr: 100_000 },
];

export const STRATEGY_TIER_PRESETS_US: readonly StrategyTierPreset[] = [
  { id: "tier_a", label: "Tier A — $18k take-home", monthly_take_home_inr: 18_000 },
  { id: "tier_b", label: "Tier B — $12k take-home", monthly_take_home_inr: 12_000 },
  { id: "tier_c", label: "Tier C — $8k take-home", monthly_take_home_inr: 8_000 },
];

export const STRATEGY_TIER_PRESETS_UK: readonly StrategyTierPreset[] = [
  { id: "tier_a", label: "Tier A — £9k take-home", monthly_take_home_inr: 9_000 },
  { id: "tier_b", label: "Tier B — £6k take-home", monthly_take_home_inr: 6_000 },
  { id: "tier_c", label: "Tier C — £4k take-home", monthly_take_home_inr: 4_000 },
];
