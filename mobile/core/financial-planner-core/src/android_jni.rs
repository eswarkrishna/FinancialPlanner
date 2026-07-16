//! JNI exports for Android (`NativeCore.kt`).

use jni::objects::{JClass, JString};
use jni::sys::{jdouble, jint, jstring};
use jni::JNIEnv;

use crate::loan::baseline_schedule;

fn schedule_json(principal_inr: f64, annual_percent: f64, tenure_months: u32) -> Result<String, String> {
    let schedule = baseline_schedule(principal_inr, annual_percent, tenure_months);
    #[derive(serde::Serialize)]
    struct GoldenSnapshot {
        emi_inr: f64,
        totals: crate::loan::ScheduleTotals,
        first_row: crate::loan::ScheduleRow,
        row_12: Option<crate::loan::ScheduleRow>,
        last_row: Option<crate::loan::ScheduleRow>,
        row_count: u32,
    }
    let snapshot = GoldenSnapshot {
        emi_inr: schedule.emi_inr,
        totals: schedule.totals.clone(),
        first_row: schedule.rows.first().cloned().ok_or("empty schedule")?,
        row_12: schedule.rows.get(11).cloned(),
        last_row: schedule.rows.last().cloned(),
        row_count: schedule.rows.len() as u32,
    };
    serde_json::to_string(&snapshot).map_err(|e| e.to_string())
}

#[no_mangle]
pub extern "system" fn Java_com_eswar_financialplanner_mobile_core_NativeCore_computeBaselineEmi(
    _env: JNIEnv,
    _class: JClass,
    principal_inr: jdouble,
    annual_percent: jdouble,
    tenure_months: jint,
) -> jdouble {
    let mut err: i32 = 0;
    unsafe {
        crate::ffi::fp_compute_baseline_emi(
            principal_inr,
            annual_percent,
            tenure_months as u32,
            &mut err as *mut i32,
        )
    }
}

#[no_mangle]
pub extern "system" fn Java_com_eswar_financialplanner_mobile_core_NativeCore_baselineScheduleJson(
    mut env: JNIEnv,
    _class: JClass,
    principal_inr: jdouble,
    annual_percent: jdouble,
    tenure_months: jint,
) -> jstring {
    let result = schedule_json(principal_inr, annual_percent, tenure_months as u32);
    let json = match result {
        Ok(s) => s,
        Err(e) => format!(r#"{{"error":"{}"}}"#, e.replace('"', "\\\"")),
    };
    match env.new_string(json) {
        Ok(s) => s.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "system" fn Java_com_eswar_financialplanner_mobile_core_NativeCore_simulateLoanJson(
    mut env: JNIEnv,
    _class: JClass,
    request_json: JString,
) -> jstring {
    let req: String = match env.get_string(&request_json) {
        Ok(s) => s.into(),
        Err(e) => {
            return env
                .new_string(format!(r#"{{"error":"{}"}}"#, e))
                .map(|s| s.into_raw())
                .unwrap_or(std::ptr::null_mut());
        }
    };
    let json = match crate::simulate::simulate_loan_json(&req) {
        Ok(s) => s,
        Err(e) => format!(r#"{{"error":"{}"}}"#, e.replace('"', "\\\"")),
    };
    match env.new_string(json) {
        Ok(s) => s.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}
