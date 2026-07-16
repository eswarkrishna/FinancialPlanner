pub mod amortisation;
pub mod emi;

use crate::rates::nominal_monthly_rate_from_annual_percent;

pub use amortisation::{
    baseline_schedule, schedule_prepay_keep_tenure, BaselineScheduleResult, ScheduleRow,
    ScheduleTotals,
};
pub use emi::compute_emi;

pub fn monthly_rate_from_annual_percent(annual_percent: f64) -> f64 {
    nominal_monthly_rate_from_annual_percent(annual_percent)
}
