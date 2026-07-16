//! FinancialPlanner core — Rust engine (SPEC §4.3 baseline EMI / amortisation).

pub mod ffi;
pub mod loan;
pub mod money;
pub mod pf;
pub mod rates;

#[cfg(target_os = "android")]
mod android_jni;

pub use loan::{
    baseline_schedule, compute_emi, schedule_prepay_keep_tenure,
    schedule_timed_prepays_keep_emi, BaselineScheduleResult, ScheduleRow, ScheduleTotals,
    TimedPrepaymentEvent,
};
pub use pf::{compute_pf_unemployment_withdrawal_plan, PfWithdrawalPlan};
