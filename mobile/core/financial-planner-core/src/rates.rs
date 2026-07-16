/// Monthly nominal rate from annual percent (e.g. 7.9 => 0.079/12). SPEC §4.3.
pub fn nominal_monthly_rate_from_annual_percent(annual_percent: f64) -> f64 {
    annual_percent / 100.0 / 12.0
}
