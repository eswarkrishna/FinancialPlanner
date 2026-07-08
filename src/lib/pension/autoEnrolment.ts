import { AE_LOWER_GBP, AE_UPPER_GBP } from "../uk/constants";
import { roundGbp } from "../money";

export interface AutoEnrolmentMonthly {
  employee_monthly_gbp: number;
  employer_monthly_gbp: number;
  qualifying_annual_gbp: number;
}

/** SPEC-UK §4.2 — auto-enrolment on qualifying earnings band. */
export function computeAutoEnrolmentMonthly(
  annualSalaryGbp: number,
  employeePct: number,
  employerPct: number,
  isEmployee: boolean,
): AutoEnrolmentMonthly {
  if (!isEmployee || annualSalaryGbp <= 0) {
    return {
      employee_monthly_gbp: 0,
      employer_monthly_gbp: 0,
      qualifying_annual_gbp: 0,
    };
  }
  const qualifying = Math.max(
    0,
    Math.min(annualSalaryGbp, AE_UPPER_GBP) - AE_LOWER_GBP,
  );
  return {
    qualifying_annual_gbp: qualifying,
    employee_monthly_gbp: roundGbp((qualifying * employeePct) / 100 / 12),
    employer_monthly_gbp: roundGbp((qualifying * employerPct) / 100 / 12),
  };
}

/** SPEC-UK §4.7 — redundancy net after £30k tax-free band. */
export function netRedundancyGbp(
  grossGbp: number,
  marginalTaxRatePct: number,
): number {
  const taxable = Math.max(0, grossGbp - 30_000);
  return roundGbp(grossGbp - (taxable * marginalTaxRatePct) / 100);
}
