import { useMemo, useState } from "react";
import {
  scheduleFixedEmiWithMonthlyExtra,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
} from "../../../lib/amortisation";
import { formatInr } from "../../../lib/formatInr";
import {
  REFERENCE_SCENARIO,
  loanInputSchema,
  type LoanInput,
} from "../../../lib/loanInputSchema";
import { computePfUnemploymentWithdrawalPlan } from "../../../lib/pf";

export type ScenarioView =
  | "BASE"
  | "PREPAY_TENURE"
  | "PREPAY_EMI"
  | "BASE_INFLOW"
  | "PREPAY_EMI_INFLOW"
  | "CASHFLOW_NO_PF"
  | "CASHFLOW_PLUS_PF"
  | "UE_PF_TO_LOAN";

export type PrepaySource = "cash" | "pf";

type ComparisonRow = {
  id: string;
  label: string;
  payoffMonth: number;
  totalInterest: number;
  totalPaid: number;
  deltaVsBaseMonths: number;
};

export function useLoanModels() {
  const [inputs, setInputs] = useState<Record<keyof LoanInput, string>>({
    principal_inr: String(REFERENCE_SCENARIO.principal_inr),
    annual_interest_rate: String(REFERENCE_SCENARIO.annual_interest_rate),
    tenure_months: String(REFERENCE_SCENARIO.tenure_months),
    cash_inr: String(REFERENCE_SCENARIO.cash_inr),
    monthly_salary_inr: String(REFERENCE_SCENARIO.monthly_salary_inr),
    pf_corpus_inr: String(REFERENCE_SCENARIO.pf_corpus_inr),
    pf_annual_interest_rate_pct: String(
      REFERENCE_SCENARIO.pf_annual_interest_rate_pct,
    ),
    monthly_pf_addition_inr: String(REFERENCE_SCENARIO.monthly_pf_addition_inr),
    gold_liquid_inr: String(REFERENCE_SCENARIO.gold_liquid_inr),
    monthly_cash_to_loan_inr: String(REFERENCE_SCENARIO.monthly_cash_to_loan_inr),
  });
  const [scenarioView, setScenarioView] = useState<ScenarioView>("BASE");
  const [prepaySource, setPrepaySource] = useState<PrepaySource>("cash");

  const parsed = useMemo(() => {
    return loanInputSchema.safeParse({
      principal_inr: inputs.principal_inr,
      annual_interest_rate: inputs.annual_interest_rate,
      tenure_months: inputs.tenure_months,
      cash_inr: inputs.cash_inr || 0,
      monthly_salary_inr: inputs.monthly_salary_inr || 0,
      pf_corpus_inr: inputs.pf_corpus_inr || 0,
      pf_annual_interest_rate_pct: inputs.pf_annual_interest_rate_pct || 0,
      monthly_pf_addition_inr: inputs.monthly_pf_addition_inr || 0,
      gold_liquid_inr: inputs.gold_liquid_inr || 0,
      monthly_cash_to_loan_inr: inputs.monthly_cash_to_loan_inr || 0,
    });
  }, [inputs]);

  const models = useMemo(() => {
    if (!parsed.success) return null;
    const v = parsed.data;
    const x = v.monthly_cash_to_loan_inr;
    const salaryRecurring = v.monthly_salary_inr;
    const recurringToLoan = x + salaryRecurring;
    const base = scheduleFixedEmiWithMonthlyExtra(
      v.principal_inr,
      v.annual_interest_rate,
      v.tenure_months,
      salaryRecurring,
    );
    const oneTimePrepayInr = prepaySource === "cash" ? v.cash_inr : v.pf_corpus_inr;
    const canPrepay = oneTimePrepayInr > 0;
    const prepayTenure = canPrepay
      ? schedulePrepayKeepTenure(
          v.principal_inr,
          v.annual_interest_rate,
          v.tenure_months,
          1,
          oneTimePrepayInr,
          salaryRecurring,
        )
      : null;
    const prepayEmi = canPrepay
      ? scheduleFixedEmiWithMonthlyExtra(
          v.principal_inr,
          v.annual_interest_rate,
          v.tenure_months,
          salaryRecurring,
          {
            month: 1,
            amount: oneTimePrepayInr,
          },
        )
      : null;
    const baseInflow =
      x > 0
        ? scheduleFixedEmiWithMonthlyExtra(
            v.principal_inr,
            v.annual_interest_rate,
            v.tenure_months,
            recurringToLoan,
          )
        : null;
    const prepayEmiInflow =
      canPrepay && x > 0
        ? scheduleFixedEmiWithMonthlyExtra(
            v.principal_inr,
            v.annual_interest_rate,
            v.tenure_months,
            recurringToLoan,
            {
              month: 1,
              amount: oneTimePrepayInr,
            },
          )
        : null;
    const pfPlan = computePfUnemploymentWithdrawalPlan(
      v.pf_corpus_inr,
      v.pf_annual_interest_rate_pct,
      v.monthly_pf_addition_inr,
    );
    const cashflowNoPf =
      v.cash_inr > 0 || x > 0
        ? scheduleTimedPrepaysKeepEmi(
            v.principal_inr,
            v.annual_interest_rate,
            v.tenure_months,
            [{ month: 1, amount_inr: v.cash_inr }],
            recurringToLoan,
          )
        : null;
    const cashflowPlusPf =
      (v.cash_inr > 0 || x > 0) && v.pf_corpus_inr > 0
        ? scheduleTimedPrepaysKeepEmi(
            v.principal_inr,
            v.annual_interest_rate,
            v.tenure_months,
            [
              { month: 1, amount_inr: v.cash_inr },
              { month: 1, amount_inr: pfPlan.tranche1_inr },
              { month: 12, amount_inr: pfPlan.tranche2_inr },
            ],
            recurringToLoan,
          )
        : null;
    const uePfToLoan =
      v.pf_corpus_inr > 0
        ? scheduleTimedPrepaysKeepEmi(
            v.principal_inr,
            v.annual_interest_rate,
            v.tenure_months,
            [
              { month: 1, amount_inr: pfPlan.tranche1_inr },
              { month: 12, amount_inr: pfPlan.tranche2_inr },
            ],
            salaryRecurring,
          )
        : null;
    return {
      v,
      base,
      prepayTenure,
      prepayEmi,
      baseInflow,
      prepayEmiInflow,
      cashflowNoPf,
      cashflowPlusPf,
      uePfToLoan,
      canPrepay,
      monthlyExtra: x,
      prepaySource,
    };
  }, [parsed, prepaySource]);

  const comparisonRows = useMemo((): ComparisonRow[] => {
    if (!models) return [];
    const baseM = models.base.totals.payoff_month;
    const rows: ComparisonRow[] = [
      {
        id: "BASE",
        label: "BASE",
        payoffMonth: models.base.totals.payoff_month,
        totalInterest: models.base.totals.total_interest_inr,
        totalPaid: models.base.totals.total_paid_inr,
        deltaVsBaseMonths: 0,
      },
    ];
    if (models.baseInflow) {
      const p = models.baseInflow.totals.payoff_month;
      rows.push({
        id: "BASE_INFLOW",
        label: `BASE + ${formatInr(models.monthlyExtra)}/mo to loan`,
        payoffMonth: p,
        totalInterest: models.baseInflow.totals.total_interest_inr,
        totalPaid: models.baseInflow.totals.total_paid_inr,
        deltaVsBaseMonths: baseM - p,
      });
    }
    if (models.prepayTenure) {
      const p = models.prepayTenure.totals.payoff_month;
      rows.push({
        id: "PREPAY_TENURE",
        label: `Prepay from ${
          models.prepaySource === "cash" ? "cash" : "PF"
        } + keep tenure`,
        payoffMonth: p,
        totalInterest: models.prepayTenure.totals.total_interest_inr,
        totalPaid: models.prepayTenure.totals.total_paid_inr,
        deltaVsBaseMonths: baseM - p,
      });
    }
    if (models.prepayEmi) {
      const p = models.prepayEmi.totals.payoff_month;
      rows.push({
        id: "PREPAY_EMI",
        label: `Prepay from ${
          models.prepaySource === "cash" ? "cash" : "PF"
        } + keep EMI`,
        payoffMonth: p,
        totalInterest: models.prepayEmi.totals.total_interest_inr,
        totalPaid: models.prepayEmi.totals.total_paid_inr,
        deltaVsBaseMonths: baseM - p,
      });
    }
    if (models.prepayEmiInflow) {
      const p = models.prepayEmiInflow.totals.payoff_month;
      rows.push({
        id: "PREPAY_EMI_INFLOW",
        label: `Prepay from ${
          models.prepaySource === "cash" ? "cash" : "PF"
        } + keep EMI + ${formatInr(models.monthlyExtra)}/mo`,
        payoffMonth: p,
        totalInterest: models.prepayEmiInflow.totals.total_interest_inr,
        totalPaid: models.prepayEmiInflow.totals.total_paid_inr,
        deltaVsBaseMonths: baseM - p,
      });
    }
    if (models.cashflowNoPf) {
      const p = models.cashflowNoPf.totals.payoff_month;
      rows.push({
        id: "CASHFLOW_NO_PF",
        label: "Cash prepay (month 1) + monthly cashflow",
        payoffMonth: p,
        totalInterest: models.cashflowNoPf.totals.total_interest_inr,
        totalPaid: models.cashflowNoPf.totals.total_paid_inr,
        deltaVsBaseMonths: baseM - p,
      });
    }
    if (models.cashflowPlusPf) {
      const p = models.cashflowPlusPf.totals.payoff_month;
      rows.push({
        id: "CASHFLOW_PLUS_PF",
        label: "Cash + monthly cashflow + PF tranches",
        payoffMonth: p,
        totalInterest: models.cashflowPlusPf.totals.total_interest_inr,
        totalPaid: models.cashflowPlusPf.totals.total_paid_inr,
        deltaVsBaseMonths: baseM - p,
      });
    }
    if (models.uePfToLoan) {
      const p = models.uePfToLoan.totals.payoff_month;
      rows.push({
        id: "UE_PF_TO_LOAN",
        label: "UE PF to loan (75% m1 + 25%+interest m12)",
        payoffMonth: p,
        totalInterest: models.uePfToLoan.totals.total_interest_inr,
        totalPaid: models.uePfToLoan.totals.total_paid_inr,
        deltaVsBaseMonths: baseM - p,
      });
    }
    return rows;
  }, [models]);

  const pfWithdrawalPlan = useMemo(() => {
    if (!models) return null;
    return computePfUnemploymentWithdrawalPlan(
      models.v.pf_corpus_inr,
      models.v.pf_annual_interest_rate_pct,
      models.v.monthly_pf_addition_inr,
    );
  }, [models]);

  const activeRows = useMemo(() => {
    if (!models) return [];
    if (scenarioView === "BASE") return models.base.rows;
    if (scenarioView === "PREPAY_TENURE" && models.prepayTenure)
      return models.prepayTenure.rows;
    if (scenarioView === "PREPAY_EMI" && models.prepayEmi) return models.prepayEmi.rows;
    if (scenarioView === "BASE_INFLOW" && models.baseInflow) return models.baseInflow.rows;
    if (scenarioView === "PREPAY_EMI_INFLOW" && models.prepayEmiInflow)
      return models.prepayEmiInflow.rows;
    if (scenarioView === "CASHFLOW_NO_PF" && models.cashflowNoPf)
      return models.cashflowNoPf.rows;
    if (scenarioView === "CASHFLOW_PLUS_PF" && models.cashflowPlusPf)
      return models.cashflowPlusPf.rows;
    if (scenarioView === "UE_PF_TO_LOAN" && models.uePfToLoan)
      return models.uePfToLoan.rows;
    return models.base.rows;
  }, [models, scenarioView]);

  function setField<K extends keyof LoanInput>(key: K, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function loadReference() {
    setInputs({
      principal_inr: String(REFERENCE_SCENARIO.principal_inr),
      annual_interest_rate: String(REFERENCE_SCENARIO.annual_interest_rate),
      tenure_months: String(REFERENCE_SCENARIO.tenure_months),
      cash_inr: String(REFERENCE_SCENARIO.cash_inr),
      monthly_salary_inr: String(REFERENCE_SCENARIO.monthly_salary_inr),
      pf_corpus_inr: String(REFERENCE_SCENARIO.pf_corpus_inr),
      pf_annual_interest_rate_pct: String(
        REFERENCE_SCENARIO.pf_annual_interest_rate_pct,
      ),
      monthly_pf_addition_inr: String(REFERENCE_SCENARIO.monthly_pf_addition_inr),
      gold_liquid_inr: String(REFERENCE_SCENARIO.gold_liquid_inr),
      monthly_cash_to_loan_inr: String(REFERENCE_SCENARIO.monthly_cash_to_loan_inr),
    });
    setScenarioView("BASE");
  }

  return {
    inputs,
    setField,
    loadReference,
    parsed,
    models,
    comparisonRows,
    pfWithdrawalPlan,
    activeRows,
    scenarioView,
    setScenarioView,
    prepaySource,
    setPrepaySource,
  };
}
