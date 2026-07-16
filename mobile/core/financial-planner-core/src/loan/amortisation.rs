use serde::{Deserialize, Serialize};

use super::emi::compute_emi;
use crate::money::round_inr;
use crate::rates::nominal_monthly_rate_from_annual_percent;

pub const BALANCE_EPSILON_INR: f64 = 0.005;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ScheduleRow {
    pub month: u32,
    pub opening_inr: f64,
    pub interest_inr: f64,
    pub principal_inr: f64,
    pub prepayment_inr: f64,
    pub closing_inr: f64,
    pub payment_inr: f64,
    pub emi_inr: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ScheduleTotals {
    pub total_paid_inr: f64,
    pub total_interest_inr: f64,
    pub total_prepayments_inr: f64,
    pub payoff_month: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BaselineScheduleResult {
    pub emi_inr: f64,
    pub rows: Vec<ScheduleRow>,
    pub totals: ScheduleTotals,
}

fn push_row(
    rows: &mut Vec<ScheduleRow>,
    month: u32,
    opening: f64,
    interest: f64,
    principal: f64,
    prepay: f64,
    closing: f64,
    emi_shown: f64,
) {
    let payment = round_inr(interest + principal + prepay);
    rows.push(ScheduleRow {
        month,
        opening_inr: opening,
        interest_inr: interest,
        principal_inr: principal,
        prepayment_inr: prepay,
        closing_inr: closing,
        payment_inr: payment,
        emi_inr: emi_shown,
    });
}

/// Baseline: no prepayment, EMI fixed for full tenure; last month clears residual. SPEC §4.3.
pub fn baseline_schedule(
    principal_inr: f64,
    annual_percent: f64,
    tenure_months: u32,
) -> BaselineScheduleResult {
    let emi = compute_emi(principal_inr, annual_percent, tenure_months);
    let r = nominal_monthly_rate_from_annual_percent(annual_percent);
    let mut rows = Vec::with_capacity(tenure_months as usize);
    let mut balance = round_inr(principal_inr);
    let mut total_interest = 0.0;
    let mut total_paid = 0.0;

    for m in 1..=tenure_months {
        let opening = balance;
        let interest = round_inr(opening * r);
        let is_last = m == tenure_months;
        let principal = if is_last {
            opening
        } else {
            round_inr(opening.min(emi - interest))
        };
        let payment = round_inr(interest + principal);
        balance = round_inr(opening - principal);
        push_row(
            &mut rows,
            m,
            opening,
            interest,
            principal,
            0.0,
            balance,
            emi,
        );
        total_interest += interest;
        total_paid += payment;
    }

    BaselineScheduleResult {
        emi_inr: emi,
        rows,
        totals: ScheduleTotals {
            total_paid_inr: round_inr(total_paid),
            total_interest_inr: round_inr(total_interest),
            total_prepayments_inr: 0.0,
            payoff_month: tenure_months,
        },
    }
}

/// Prepay at end of month `prepay_month` (1-based), after EMI.
/// Exactly `tenure_months` calendar months; EMI recomputed each month (keep tenure). SPEC §4.4.
pub fn schedule_prepay_keep_tenure(
    principal_inr: f64,
    annual_percent: f64,
    tenure_months: u32,
    prepay_month: u32,
    prepayment_inr: f64,
    monthly_extra_inr: f64,
) -> BaselineScheduleResult {
    let r = nominal_monthly_rate_from_annual_percent(annual_percent);
    let mut rows = Vec::with_capacity(tenure_months as usize);
    let mut balance = round_inr(principal_inr);
    let mut total_interest = 0.0;
    let mut total_paid = 0.0;
    let mut total_prepay = 0.0;
    let monthly_extra = monthly_extra_inr.max(0.0);
    let mut emi_at_start: Option<f64> = None;

    for m in 1..=tenure_months {
        if balance <= BALANCE_EPSILON_INR {
            break;
        }
        let opening = balance;
        let rem = tenure_months - m + 1;
        let emi = compute_emi(opening, annual_percent, rem);
        if emi_at_start.is_none() {
            emi_at_start = Some(emi);
        }
        let interest = round_inr(opening * r);
        let is_last = m == tenure_months;
        let principal = if is_last {
            opening
        } else {
            round_inr(opening.min(emi - interest))
        };
        let pay_emi = round_inr(interest + principal);
        balance = round_inr(opening - principal);

        let mut prepay = 0.0;
        if m == prepay_month && prepayment_inr > 0.0 {
            prepay = round_inr(prepayment_inr.min(balance));
            balance = round_inr(balance - prepay);
            total_prepay += prepay;
        }

        let mut extra = 0.0;
        if monthly_extra > 0.0 && balance > BALANCE_EPSILON_INR {
            extra = round_inr(monthly_extra.min(balance));
            balance = round_inr(balance - extra);
            total_prepay += extra;
        }

        let prepay_shown = round_inr(prepay + extra);
        push_row(
            &mut rows,
            m,
            opening,
            interest,
            principal,
            prepay_shown,
            balance,
            emi,
        );
        total_interest += interest;
        total_paid += round_inr(pay_emi + prepay_shown);
    }

    BaselineScheduleResult {
        emi_inr: emi_at_start.unwrap_or(0.0),
        rows,
        totals: ScheduleTotals {
            total_paid_inr: round_inr(total_paid),
            total_interest_inr: round_inr(total_interest),
            total_prepayments_inr: round_inr(total_prepay),
            payoff_month: tenure_months,
        },
    }
}
