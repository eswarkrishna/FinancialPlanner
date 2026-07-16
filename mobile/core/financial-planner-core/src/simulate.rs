//! Loan simulation API — JSON in/out for mobile shells.

use serde::{Deserialize, Serialize};

use crate::loan::{
    baseline_schedule, schedule_prepay_keep_emi, schedule_prepay_keep_tenure,
    schedule_timed_prepays_keep_emi, BaselineScheduleResult, TimedPrepaymentEvent,
};
use crate::pf::compute_pf_unemployment_withdrawal_plan;

#[derive(Debug, Clone, Deserialize)]
pub struct LoanSimulateRequest {
    pub principal_inr: f64,
    pub annual_interest_rate: f64,
    pub tenure_months: u32,
    #[serde(default)]
    pub one_time_prepay: Option<OneTimePrepayInput>,
    #[serde(default)]
    pub pf_unemployment: Option<PfUnemploymentInput>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OneTimePrepayInput {
    pub month: u32,
    pub amount_inr: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PfUnemploymentInput {
    pub pf_corpus_inr: f64,
    #[serde(default = "default_pf_rate")]
    pub pf_annual_interest_rate_pct: f64,
    #[serde(default)]
    pub monthly_pf_addition_inr: f64,
}

fn default_pf_rate() -> f64 {
    crate::pf::DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT
}

#[derive(Debug, Clone, Serialize)]
pub struct LoanSimulateResponse {
    pub baseline: ScenarioSnapshot,
    pub prepay_keep_emi: Option<ScenarioSnapshot>,
    pub prepay_keep_tenure: Option<ScenarioSnapshot>,
    pub pf_to_loan: Option<ScenarioSnapshot>,
    pub strategy_compare: Vec<StrategyCompareRow>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ScenarioSnapshot {
    pub emi_inr: f64,
    pub totals: crate::loan::ScheduleTotals,
    pub row_count: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct StrategyCompareRow {
    pub id: String,
    pub policy_label: String,
    pub new_emi_inr: f64,
    pub new_tenure_months: u32,
    pub total_interest_inr: f64,
    pub gross_interest_saved_inr: f64,
}

fn snapshot(result: &BaselineScheduleResult) -> ScenarioSnapshot {
    ScenarioSnapshot {
        emi_inr: result.emi_inr,
        totals: result.totals.clone(),
        row_count: result.rows.len() as u32,
    }
}

pub fn simulate_loan(request: &LoanSimulateRequest) -> LoanSimulateResponse {
    let p = request.principal_inr;
    let r = request.annual_interest_rate;
    let t = request.tenure_months;

    let baseline = baseline_schedule(p, r, t);
    let base_interest = baseline.totals.total_interest_inr;
    let base_emi = baseline.emi_inr;

    let mut prepay_keep_emi = None;
    let mut prepay_keep_tenure = None;
    let mut pf_to_loan = None;
    let mut strategy_compare = Vec::new();

    if let Some(ref prepay) = request.one_time_prepay {
        if prepay.month >= 1 && prepay.amount_inr > 0.0 {
            let emi_result = schedule_prepay_keep_emi(p, r, t, prepay.month, prepay.amount_inr);
            let tenure_result =
                schedule_prepay_keep_tenure(p, r, t, prepay.month, prepay.amount_inr, 0.0);

            let reduced_emi = tenure_result
                .rows
                .get(1)
                .map(|row| row.emi_inr)
                .unwrap_or(base_emi);

            strategy_compare.push(StrategyCompareRow {
                id: "PREPAY_EMI".into(),
                policy_label: "Reduce tenure (keep EMI)".into(),
                new_emi_inr: base_emi,
                new_tenure_months: emi_result.totals.payoff_month,
                total_interest_inr: emi_result.totals.total_interest_inr,
                gross_interest_saved_inr: base_interest - emi_result.totals.total_interest_inr,
            });
            strategy_compare.push(StrategyCompareRow {
                id: "PREPAY_TENURE".into(),
                policy_label: "Reduce EMI (keep tenure)".into(),
                new_emi_inr: reduced_emi,
                new_tenure_months: tenure_result.totals.payoff_month,
                total_interest_inr: tenure_result.totals.total_interest_inr,
                gross_interest_saved_inr: base_interest - tenure_result.totals.total_interest_inr,
            });

            prepay_keep_emi = Some(snapshot(&emi_result));
            prepay_keep_tenure = Some(snapshot(&tenure_result));
        }
    }

    if let Some(ref pf) = request.pf_unemployment {
        if pf.pf_corpus_inr > 0.0 {
            let plan = compute_pf_unemployment_withdrawal_plan(
                pf.pf_corpus_inr,
                pf.pf_annual_interest_rate_pct,
                pf.monthly_pf_addition_inr,
            );
            let pf_result = schedule_timed_prepays_keep_emi(
                p,
                r,
                t,
                &[
                    TimedPrepaymentEvent {
                        month: 1,
                        amount_inr: plan.tranche1_inr,
                    },
                    TimedPrepaymentEvent {
                        month: 12,
                        amount_inr: plan.tranche2_inr,
                    },
                ],
                0.0,
            );
            pf_to_loan = Some(snapshot(&pf_result));
        }
    }

    LoanSimulateResponse {
        baseline: snapshot(&baseline),
        prepay_keep_emi,
        prepay_keep_tenure,
        pf_to_loan,
        strategy_compare,
    }
}

pub fn simulate_loan_json(json: &str) -> Result<String, String> {
    let request: LoanSimulateRequest =
        serde_json::from_str(json).map_err(|e| format!("invalid request: {e}"))?;
    let response = simulate_loan(&request);
    serde_json::to_string(&response).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reference_one_time_prepay_compare() {
        let response = simulate_loan(&LoanSimulateRequest {
            principal_inr: 5_000_000.0,
            annual_interest_rate: 7.9,
            tenure_months: 168,
            one_time_prepay: Some(OneTimePrepayInput {
                month: 1,
                amount_inr: 2_500_000.0,
            }),
            pf_unemployment: None,
        });
        assert_eq!(response.strategy_compare.len(), 2);
        let keep_tenure = response.prepay_keep_tenure.as_ref().unwrap();
        assert_eq!(keep_tenure.totals.total_prepayments_inr, 2_500_000.0);
        assert_eq!(keep_tenure.totals.payoff_month, 168);
    }
}
