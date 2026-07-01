/** Spec §4.12.2 — canonical 0.4 / 0.6 split for STRATEGY_EQUITY_BLEND. */
export const EQUITY_BLEND_PREPAY_FRACTION = 0.4;

/** Derived: portion of EXTRA routed to extra principal under STRATEGY_EQUITY_BLEND. */
export const EQUITY_BLEND_EXTRA_TO_PRINCIPAL_FRACTION = 0.6;

/** Spec §9 BELOW_SUBSISTENCE — strategy rows whose min living budget falls below this fire a warning. */
export const SUBSISTENCE_FLOOR_INR = 15_000;

/** SPEC-US §9 — US subsistence floor in USD (stored in locale-neutral numeric fields). */
export const SUBSISTENCE_FLOOR_USD = 2_000;

/** Spec §9 FRAGILE_CASH_FLOW — EMI/THM ratio above this fires a warning on every strategy. */
export const FRAGILE_CASH_FLOW_RATIO = 0.5;

/** Spec §4.12.4 — equity LTCG rate applied to gain over the exemption at horizon (India). */
export const LTCG_RATE_PCT = 12.5;

/** SPEC-US §4.12 — US long-term cap gains default (no exemption floor in v1). */
export const LTCG_RATE_PCT_US = 15;

/** Spec §4.12.4 — annual LTCG exemption (India v1.7 nominal). */
export const LTCG_EXEMPTION_INR = 125_000;
