//! Golden parity tests — Rust core vs web `src/test/fixtures/goldens/*.json`.

use financial_planner_core::loan::{baseline_schedule, schedule_prepay_keep_tenure};
use financial_planner_core::loan::{ScheduleRow, ScheduleTotals};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Deserialize, Serialize, PartialEq)]
struct GoldenSnapshot {
    emi_inr: f64,
    totals: ScheduleTotals,
    first_row: ScheduleRow,
    row_12: Option<ScheduleRow>,
    last_row: Option<ScheduleRow>,
    row_count: u32,
}

fn fixtures_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("..")
        .join("src")
        .join("test")
        .join("fixtures")
        .join("goldens")
}

fn load_golden(name: &str) -> GoldenSnapshot {
    let path = fixtures_dir().join(format!("{name}.json"));
    let raw = fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()))
}

fn compact(result: &financial_planner_core::loan::BaselineScheduleResult) -> GoldenSnapshot {
    GoldenSnapshot {
        emi_inr: result.emi_inr,
        totals: result.totals.clone(),
        first_row: result.rows.first().cloned().expect("rows"),
        row_12: result.rows.get(11).cloned(),
        last_row: result.rows.last().cloned(),
        row_count: result.rows.len() as u32,
    }
}

/// Reference loan: 50L @ 7.9% / 168 months (`makeReferenceLoanInput`).
const PRINCIPAL: f64 = 5_000_000.0;
const RATE: f64 = 7.9;
const TENURE: u32 = 168;

#[test]
fn golden_base_matches_web() {
    let expected = load_golden("BASE");
    let actual = compact(&baseline_schedule(PRINCIPAL, RATE, TENURE));
    assert_eq!(actual, expected);
}

#[test]
fn golden_prepay_cash_25l_tenure_matches_web() {
    let expected = load_golden("PREPAY_CASH_25L_TENURE");
    let actual = compact(&schedule_prepay_keep_tenure(
        PRINCIPAL,
        RATE,
        TENURE,
        1,
        2_500_000.0,
        0.0,
    ));
    assert_eq!(actual, expected);
}
