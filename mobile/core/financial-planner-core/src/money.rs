/// Half-up rounding to 2 decimal places (paise). Matches `src/lib/money.ts` `roundInr`.
pub fn round_inr(value: f64) -> f64 {
    let scaled = value * 100.0;
    let rounded = scaled.signum() * scaled.abs().round();
    rounded / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_inr_matches_js_math_round() {
        // f64 quirk: 1.005 * 100 === 100.499... in both JS and Rust
        assert_eq!(round_inr(1.005), 1.0);
        assert_eq!(round_inr(1.004), 1.0);
        assert_eq!(round_inr(49282.445), 49_282.45);
    }
}
