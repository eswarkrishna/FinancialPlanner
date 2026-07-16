//! FinancialPlanner core — Rust engine (SPEC §4.3 baseline EMI / amortisation).

pub mod ffi;
pub mod loan;
pub mod money;
pub mod rates;

pub use loan::{
    baseline_schedule, compute_emi, schedule_prepay_keep_tenure, BaselineScheduleResult,
    ScheduleRow, ScheduleTotals,
};
