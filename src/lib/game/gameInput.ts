import { z } from "zod";
import { loanInputSchema } from "../loanInputSchema";
import { P0_GAME_PROFILES } from "./constants";
import type { GameProfileId, LenderObjective, PayoffMetric } from "./types";

export const gameProfileIdSchema = z.enum(P0_GAME_PROFILES);

export const payoffMetricSchema = z.enum([
  "MINUS_TOTAL_INTEREST",
  "MINUS_TOTAL_OUTFLOW",
  "NET_WORTH_HORIZON",
  "INTEREST_SAVED_MINUS_FEES",
  "MIN_CASH_RUNWAY",
]);

export const lenderObjectiveSchema = z.enum(["L_FEE_INCOME", "L_INTEREST_INCOME"]);

/** Spec §4.13.10 — loan fields + game controls. */
export const gameInputSchema = loanInputSchema.extend({
  game_profile_id: gameProfileIdSchema,
  payoff_metric: payoffMetricSchema.optional().default("INTEREST_SAVED_MINUS_FEES"),
  lender_objective: lenderObjectiveSchema.optional().default("L_FEE_INCOME"),
  cooperative: z.boolean().optional().default(false),
  prepayment_fee_inr: z.coerce.number().min(0).optional().default(25_000),
  prepayment_fee_pct: z.coerce.number().min(0).max(100).optional().default(1),
  horizon_months: z.coerce.number().int().positive().max(600).optional(),
  monthly_take_home_inr: z.coerce.number().min(0).optional().default(200_000),
  monthly_living_expense_inr: z.coerce.number().min(0).optional().default(80_000),
  emergency_months_buffer: z.coerce.number().min(0).optional().default(6),
  expected_equity_return_pct: z.coerce.number().min(0).optional().default(11),
  pf_annual_interest_rate_pct: z.coerce.number().min(0).optional().default(8.25),
  monthly_pf_addition_inr: z.coerce.number().min(0).optional().default(0),
  extra_monthly_income_inr: z.coerce.number().min(0).optional().default(0),
  extra_income_post_tax: z.boolean().optional().default(true),
  marginal_tax_rate_pct: z.coerce.number().min(0).max(100).optional().default(0),
  repayment_pct_of_take_home: z.coerce.number().min(0).max(100).optional().default(80),
  w_b: z.coerce.number().min(0).max(1).optional().default(0.5),
  w_h: z.coerce.number().min(0).max(1).optional().default(0.5),
});

export type GameInput = z.infer<typeof gameInputSchema>;

export function toGameProfileId(id: string): GameProfileId {
  return gameProfileIdSchema.parse(id);
}

export function defaultPayoffMetric(
  metric: PayoffMetric | undefined,
): PayoffMetric {
  return metric ?? "INTEREST_SAVED_MINUS_FEES";
}

export function defaultLenderObjective(
  objective: LenderObjective | undefined,
): LenderObjective {
  return objective ?? "L_FEE_INCOME";
}
