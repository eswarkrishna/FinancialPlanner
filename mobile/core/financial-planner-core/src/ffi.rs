//! C ABI for Kotlin (JNI) and Swift. Expand as modules are ported.

use std::ffi::{c_char, CStr};
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::sync::Mutex;

use crate::loan::baseline_schedule;

static LAST_ERROR: Mutex<Option<String>> = Mutex::new(None);

fn set_last_error(msg: String) {
    if let Ok(mut guard) = LAST_ERROR.lock() {
        *guard = Some(msg);
    }
}

/// Compute baseline EMI. Returns EMI in INR or 0.0 on error.
///
/// # Safety
/// `error_out` may be null; if non-null, set to 1 on error.
#[no_mangle]
pub unsafe extern "C" fn fp_compute_baseline_emi(
    principal_inr: f64,
    annual_percent: f64,
    tenure_months: u32,
    error_out: *mut i32,
) -> f64 {
    let result = catch_unwind(AssertUnwindSafe(|| {
        crate::loan::compute_emi(principal_inr, annual_percent, tenure_months)
    }));
    match result {
        Ok(emi) => {
            if !error_out.is_null() {
                *error_out = 0;
            }
            emi
        }
        Err(_) => {
            set_last_error("fp_compute_baseline_emi panicked".into());
            if !error_out.is_null() {
                *error_out = 1;
            }
            0.0
        }
    }
}

/// Serialize baseline schedule snapshot as JSON into `out_buf`.
/// Returns bytes written, or -1 on error.
///
/// # Safety
/// `out_buf` must point to at least `out_cap` bytes.
#[no_mangle]
pub unsafe extern "C" fn fp_baseline_schedule_json(
    principal_inr: f64,
    annual_percent: f64,
    tenure_months: u32,
    out_buf: *mut c_char,
    out_cap: usize,
) -> i64 {
    let schedule = baseline_schedule(principal_inr, annual_percent, tenure_months);
    let snapshot = golden_compact(&schedule);
    let json = match serde_json::to_string(&snapshot) {
        Ok(s) => s,
        Err(e) => {
            set_last_error(e.to_string());
            return -1;
        }
    };
    write_cstr(out_buf, out_cap, &json)
}

fn write_cstr(out_buf: *mut c_char, out_cap: usize, s: &str) -> i64 {
    if out_buf.is_null() || out_cap == 0 {
        set_last_error("null or zero-capacity output buffer".into());
        return -1;
    }
    let bytes = s.as_bytes();
    if bytes.len() + 1 > out_cap {
        set_last_error(format!(
            "buffer too small: need {} bytes, have {}",
            bytes.len() + 1,
            out_cap
        ));
        return -1;
    }
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), out_buf as *mut u8, bytes.len());
        *out_buf.add(bytes.len()) = 0;
    }
    bytes.len() as i64
}

/// Copy last error message into `out_buf`. Returns bytes written or -1.
///
/// # Safety
/// `out_buf` must point to at least `out_cap` bytes.
#[no_mangle]
pub unsafe extern "C" fn fp_last_error(out_buf: *mut c_char, out_cap: usize) -> i64 {
    let msg = LAST_ERROR
        .lock()
        .ok()
        .and_then(|g| g.clone())
        .unwrap_or_default();
    write_cstr(out_buf, out_cap, &msg)
}

#[derive(serde::Serialize)]
struct GoldenSnapshot {
    emi_inr: f64,
    totals: crate::loan::ScheduleTotals,
    first_row: crate::loan::ScheduleRow,
    row_12: Option<crate::loan::ScheduleRow>,
    last_row: Option<crate::loan::ScheduleRow>,
    row_count: u32,
}

fn golden_compact(
    result: &crate::loan::BaselineScheduleResult,
) -> GoldenSnapshot {
    GoldenSnapshot {
        emi_inr: result.emi_inr,
        totals: result.totals.clone(),
        first_row: result.rows.first().cloned().expect("non-empty schedule"),
        row_12: result.rows.get(11).cloned(),
        last_row: result.rows.last().cloned(),
        row_count: result.rows.len() as u32,
    }
}

/// Parse JSON loan input and return EMI (stub for full schema validation).
///
/// # Safety
/// `json` must be a valid UTF-8 null-terminated C string.
#[no_mangle]
pub unsafe extern "C" fn fp_parse_and_emi(json: *const c_char, error_out: *mut i32) -> f64 {
    if json.is_null() {
        set_last_error("null json pointer".into());
        if !error_out.is_null() {
            *error_out = 1;
        }
        return 0.0;
    }
    let c_str = unsafe { CStr::from_ptr(json) };
    let s = match c_str.to_str() {
        Ok(s) => s,
        Err(e) => {
            set_last_error(e.to_string());
            if !error_out.is_null() {
                *error_out = 1;
            }
            return 0.0;
        }
    };
    #[derive(serde::Deserialize)]
    struct LoanBaselineInput {
        principal_inr: f64,
        annual_interest_rate: f64,
        tenure_months: u32,
    }
    let input: LoanBaselineInput = match serde_json::from_str(s) {
        Ok(v) => v,
        Err(e) => {
            set_last_error(e.to_string());
            if !error_out.is_null() {
                *error_out = 1;
            }
            return 0.0;
        }
    };
    fp_compute_baseline_emi(
        input.principal_inr,
        input.annual_interest_rate,
        input.tenure_months,
        error_out,
    )
}
