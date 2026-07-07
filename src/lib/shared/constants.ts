export const BALANCE_EPSILON_INR = 0.005;

/** Max months simulated in cashflow default paths (avoids runaway negative amortisation). */
export const MAX_CASHFLOW_SIM_MONTHS = 600;

/** Max amortisation rows rendered in the loan schedule table. */
export const MAX_SCHEDULE_DISPLAY_ROWS = 600;

/** Consecutive EMI/payment shortfalls before stopping cashflow simulation. */
export const MAX_CONSECUTIVE_PAYMENT_SHORTFALLS = 24;
