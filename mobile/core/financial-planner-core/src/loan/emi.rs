use crate::money::round_inr;
use crate::rates::nominal_monthly_rate_from_annual_percent;

/// Standard reducing-balance EMI (annuity). SPEC §4.3.
pub fn compute_emi(principal_inr: f64, annual_percent: f64, tenure_months: u32) -> f64 {
    if principal_inr <= 0.0 || tenure_months == 0 {
        panic!("principal and tenure must be positive");
    }
    let r = nominal_monthly_rate_from_annual_percent(annual_percent);
    if r == 0.0 {
        return round_inr(principal_inr / tenure_months as f64);
    }
    let pow = (1.0 + r).powi(tenure_months as i32);
    let emi = (principal_inr * r * pow) / (pow - 1.0);
    round_inr(emi)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reference_loan_emi() {
        // 50L @ 7.9% for 168 months — golden BASE.json
        let emi = compute_emi(5_000_000.0, 7.9, 168);
        assert_eq!(emi, 49_282.45);
    }
}
