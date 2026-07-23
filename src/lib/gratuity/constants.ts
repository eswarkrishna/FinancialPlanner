/** Statutory gratuity cap (Payment of Gratuity Act, as amended). */
export const GRATUITY_MAX_PAYOUT_INR = 2_000_000;

export const GRATUITY_MIN_SERVICE_YEARS = 5;

/** Days factor in gratuity formula: (salary × 15 × years) / 26. */
export const GRATUITY_FORMULA_NUMERATOR = 15;
export const GRATUITY_FORMULA_DENOMINATOR = 26;

export type GratuityFormDefaults = {
  last_drawn_salary_inr: string;
  years_of_service: string;
};

export const REFERENCE_GRATUITY_FORM: GratuityFormDefaults = {
  last_drawn_salary_inr: "50000",
  years_of_service: "10",
};
