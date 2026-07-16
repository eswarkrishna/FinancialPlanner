//! SPEC §4.7 — PF unemployment withdrawal tranches.

use crate::money::round_inr;

pub const DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT: f64 = 8.25;

#[derive(Debug, Clone, PartialEq)]
pub struct PfWithdrawalPlan {
    pub tranche1_inr: f64,
    pub tranche2_inr: f64,
    pub total_withdrawn_inr: f64,
}

/// Month 1: 75% of PF0; month 12: remaining 25% + additions + one year interest.
pub fn compute_pf_unemployment_withdrawal_plan(
    pf_corpus_inr: f64,
    annual_interest_rate_pct: f64,
    monthly_pf_addition_inr: f64,
) -> PfWithdrawalPlan {
    let safe_pf = pf_corpus_inr.max(0.0);
    let safe_rate = annual_interest_rate_pct.max(0.0);
    let safe_monthly = monthly_pf_addition_inr.max(0.0);
    let tranche1 = round_inr(safe_pf * 0.75);
    let remaining = round_inr(safe_pf - tranche1);
    let after_monthly = round_inr(remaining + safe_monthly * 12.0);
    let tranche2 = round_inr(after_monthly * (1.0 + safe_rate / 100.0));
    PfWithdrawalPlan {
        tranche1_inr: tranche1,
        tranche2_inr: tranche2,
        total_withdrawn_inr: round_inr(tranche1 + tranche2),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reference_pf_plan() {
        let plan = compute_pf_unemployment_withdrawal_plan(2_500_000.0, 8.25, 0.0);
        assert_eq!(plan.tranche1_inr, 1_875_000.0);
        assert_eq!(plan.tranche2_inr, 676_562.5);
    }
}
