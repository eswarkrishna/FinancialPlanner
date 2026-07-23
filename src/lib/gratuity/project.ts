import { roundInr } from "../money";
import {
  GRATUITY_FORMULA_DENOMINATOR,
  GRATUITY_FORMULA_NUMERATOR,
  GRATUITY_MAX_PAYOUT_INR,
  GRATUITY_MIN_SERVICE_YEARS,
} from "./constants";

export type GratuityWarningCode = "GRATUITY_BELOW_MIN_YEARS" | "GRATUITY_CAPPED";

export interface GratuityInput {
  last_drawn_salary_inr: number;
  years_of_service: number;
}

export interface GratuityProjection {
  gratuity_payable_inr: number;
  raw_gratuity_inr: number;
  is_capped: boolean;
  warnings: GratuityWarningCode[];
}

export function collectGratuityWarnings(
  input: GratuityInput,
  rawGratuity: number,
  payable: number,
): GratuityWarningCode[] {
  const warnings: GratuityWarningCode[] = [];
  const years = Math.max(0, input.years_of_service);

  if (years < GRATUITY_MIN_SERVICE_YEARS) {
    warnings.push("GRATUITY_BELOW_MIN_YEARS");
  }
  if (rawGratuity > payable && payable === GRATUITY_MAX_PAYOUT_INR) {
    warnings.push("GRATUITY_CAPPED");
  }
  return warnings;
}

export function projectGratuityPayout(input: GratuityInput): GratuityProjection {
  const salary = Math.max(0, input.last_drawn_salary_inr);
  const years = Math.max(0, input.years_of_service);

  const raw_gratuity_inr = roundInr(
    (salary * GRATUITY_FORMULA_NUMERATOR * years) / GRATUITY_FORMULA_DENOMINATOR,
  );
  const gratuity_payable_inr = roundInr(Math.min(raw_gratuity_inr, GRATUITY_MAX_PAYOUT_INR));
  const is_capped = raw_gratuity_inr > GRATUITY_MAX_PAYOUT_INR;
  const warnings = collectGratuityWarnings(input, raw_gratuity_inr, gratuity_payable_inr);

  return {
    gratuity_payable_inr,
    raw_gratuity_inr,
    is_capped,
    warnings,
  };
}
