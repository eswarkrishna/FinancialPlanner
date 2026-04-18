import { type ChangeEvent, useMemo, useState } from "react";
import {
  scheduleFixedEmiWithMonthlyExtra,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
  type ScheduleRow,
} from "./lib/amortisation";
import {
  simulateDebtPayoff,
  type DebtInput,
  type DebtStrategy,
} from "./lib/debtPlanner";
import { formatInr } from "./lib/formatInr";
import {
  REFERENCE_SCENARIO,
  loanInputSchema,
  type LoanInput,
} from "./lib/loanInputSchema";
import { computePfUnemploymentWithdrawalPlan } from "./lib/pf";
import {
  buildRetirementScenarios,
  type RetirementInput,
} from "./lib/retirement";

type ScenarioView =
  | "BASE"
  | "PREPAY_TENURE"
  | "PREPAY_EMI"
  | "BASE_INFLOW"
  | "PREPAY_EMI_INFLOW"
  | "CASHFLOW_NO_PF"
  | "CASHFLOW_PLUS_PF"
  | "UE_PF_TO_LOAN";
type PrepaySource = "cash" | "pf";

type DebtFormRow = {
  id: string;
  name: string;
  balance_inr: string;
  apr_pct: string;
  minimum_payment_inr: string;
};

type RetirementFormState = {
  current_corpus_inr: string;
  monthly_contribution_inr: string;
  annual_return_pct: string;
  inflation_pct: string;
  years_to_retirement: string;
  annual_expense_today_inr: string;
  safe_withdrawal_rate_pct: string;
};

type ComparisonRow = {
  id: string;
  label: string;
  payoffMonth: number;
  totalInterest: number;
  totalPaid: number;
  deltaVsBaseMonths: number;
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function ScenarioTable({ rows }: { rows: ScheduleRow[] }) {
  return (
    <div className="table-wrap">
      <table className="schedule">
        <thead>
          <tr>
            <th>Month</th>
            <th>Opening</th>
            <th>Interest</th>
            <th>Principal (EMI)</th>
            <th>Prepay / extra</th>
            <th>Closing</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month}>
              <td>{r.month}</td>
              <td>{formatInr(r.opening_inr)}</td>
              <td>{formatInr(r.interest_inr)}</td>
              <td>{formatInr(r.principal_inr)}</td>
              <td>{r.prepayment_inr > 0 ? formatInr(r.prepayment_inr) : "—"}</td>
              <td>{formatInr(r.closing_inr)}</td>
              <td>{formatInr(r.payment_inr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function App() {
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
      recurringToLoan,
      oneTimePrepayInr,
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

  const [startDateIso, setStartDateIso] = useState("2026-04-01");
  const [monthlyBudgetInr, setMonthlyBudgetInr] = useState("40000");
  const [selectedDebtStrategy, setSelectedDebtStrategy] = useState<DebtStrategy>(
    "avalanche",
  );
  const [debtRows, setDebtRows] = useState<DebtFormRow[]>([
    {
      id: "card",
      name: "Credit Card",
      balance_inr: "150000",
      apr_pct: "36",
      minimum_payment_inr: "8000",
    },
    {
      id: "pl",
      name: "Personal Loan",
      balance_inr: "450000",
      apr_pct: "16",
      minimum_payment_inr: "12000",
    },
    {
      id: "consumer",
      name: "Consumer Durable",
      balance_inr: "80000",
      apr_pct: "14",
      minimum_payment_inr: "4000",
    },
  ]);

  const debtInputs = useMemo((): DebtInput[] => {
    return debtRows.map((row) => ({
      id: row.id,
      name: row.name,
      balance_inr: Math.max(0, parseNumber(row.balance_inr)),
      apr_pct: Math.max(0, parseNumber(row.apr_pct)),
      minimum_payment_inr: Math.max(0, parseNumber(row.minimum_payment_inr)),
    }));
  }, [debtRows]);

  const debtModels = useMemo(() => {
    const budget = Math.max(0, parseNumber(monthlyBudgetInr));
    const avalanche = simulateDebtPayoff(
      debtInputs,
      budget,
      startDateIso,
      "avalanche",
    );
    const snowball = simulateDebtPayoff(
      debtInputs,
      budget,
      startDateIso,
      "snowball",
    );
    return { avalanche, snowball };
  }, [debtInputs, monthlyBudgetInr, startDateIso]);

  const activeDebtModel =
    selectedDebtStrategy === "avalanche"
      ? debtModels.avalanche
      : debtModels.snowball;

  const [retirementInputs, setRetirementInputs] = useState<RetirementFormState>({
    current_corpus_inr: "1200000",
    monthly_contribution_inr: "30000",
    annual_return_pct: "10",
    inflation_pct: "6",
    years_to_retirement: "20",
    annual_expense_today_inr: "900000",
    safe_withdrawal_rate_pct: "4",
  });
  const [selectedRetirementScenario, setSelectedRetirementScenario] =
    useState("base");

  const retirementBaseInput = useMemo((): RetirementInput => {
    return {
      current_corpus_inr: Math.max(
        0,
        parseNumber(retirementInputs.current_corpus_inr),
      ),
      monthly_contribution_inr: Math.max(
        0,
        parseNumber(retirementInputs.monthly_contribution_inr),
      ),
      annual_return_pct: Math.max(
        0,
        parseNumber(retirementInputs.annual_return_pct),
      ),
      inflation_pct: Math.max(0, parseNumber(retirementInputs.inflation_pct)),
      years_to_retirement: Math.max(
        1,
        Math.floor(parseNumber(retirementInputs.years_to_retirement)),
      ),
      annual_expense_today_inr: Math.max(
        0,
        parseNumber(retirementInputs.annual_expense_today_inr),
      ),
      safe_withdrawal_rate_pct: Math.max(
        0.1,
        parseNumber(retirementInputs.safe_withdrawal_rate_pct),
      ),
    };
  }, [retirementInputs]);

  const retirementScenarios = useMemo(() => {
    return buildRetirementScenarios(retirementBaseInput);
  }, [retirementBaseInput]);

  const activeRetirementScenario =
    retirementScenarios.find(
      (scenario) => scenario.id === selectedRetirementScenario,
    ) ?? retirementScenarios[0];

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

  function setDebtField(
    debtId: string,
    key: keyof DebtFormRow,
    value: string,
  ): void {
    setDebtRows((prev) =>
      prev.map((row) => (row.id === debtId ? { ...row, [key]: value } : row)),
    );
  }

  function addDebt(): void {
    setDebtRows((prev) => [
      ...prev,
      {
        id: `debt-${Date.now()}`,
        name: `Debt ${prev.length + 1}`,
        balance_inr: "0",
        apr_pct: "12",
        minimum_payment_inr: "0",
      },
    ]);
  }

  function removeDebt(debtId: string): void {
    setDebtRows((prev) => prev.filter((row) => row.id !== debtId));
  }

  function setRetirementField(
    key: keyof RetirementFormState,
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const value = event.target.value;
    setRetirementInputs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="layout">
      <header className="header">
        <h1>FinancialPlanner Dashboard</h1>
        <p className="lede">
          Loan payoff scenarios, debt payoff planning (avalanche/snowball), and
          retirement corpus projections.
        </p>
      </header>

      <section className="card">
        <h2>Loan &amp; assets</h2>
        <div className="form-grid">
          <label>
            Principal (INR)
            <input
              inputMode="decimal"
              value={inputs.principal_inr}
              onChange={(e) => setField("principal_inr", e.target.value)}
            />
          </label>
          <label>
            Annual interest (%)
            <input
              inputMode="decimal"
              value={inputs.annual_interest_rate}
              onChange={(e) => setField("annual_interest_rate", e.target.value)}
            />
          </label>
          <label>
            Tenure (months)
            <input
              inputMode="numeric"
              value={inputs.tenure_months}
              onChange={(e) => setField("tenure_months", e.target.value)}
            />
          </label>
          <label>
            Monthly cash to loan (INR)
            <input
              inputMode="decimal"
              value={inputs.monthly_cash_to_loan_inr}
              onChange={(e) => setField("monthly_cash_to_loan_inr", e.target.value)}
            />
          </label>
          <label>
            Cash (INR)
            <input
              inputMode="decimal"
              value={inputs.cash_inr}
              onChange={(e) => setField("cash_inr", e.target.value)}
            />
          </label>
          <label>
            Monthly salary (INR)
            <input
              inputMode="decimal"
              value={inputs.monthly_salary_inr}
              onChange={(e) => setField("monthly_salary_inr", e.target.value)}
            />
          </label>
          <label>
            PF corpus (INR)
            <input
              inputMode="decimal"
              value={inputs.pf_corpus_inr}
              onChange={(e) => setField("pf_corpus_inr", e.target.value)}
            />
          </label>
          <label>
            PF annual interest (%)
            <input
              inputMode="decimal"
              value={inputs.pf_annual_interest_rate_pct}
              onChange={(e) =>
                setField("pf_annual_interest_rate_pct", e.target.value)
              }
            />
          </label>
          <label>
            Monthly PF addition (INR)
            <input
              inputMode="decimal"
              value={inputs.monthly_pf_addition_inr}
              onChange={(e) => setField("monthly_pf_addition_inr", e.target.value)}
            />
          </label>
          <label>
            Gold liquid (INR)
            <input
              inputMode="decimal"
              value={inputs.gold_liquid_inr}
              onChange={(e) => setField("gold_liquid_inr", e.target.value)}
            />
          </label>
        </div>
        <p className="hint">
          <strong>Monthly cash to loan:</strong> amount applied as{" "}
          <strong>extra principal</strong> after each month&apos;s scheduled EMI.
          <strong> Monthly salary</strong> is also added as recurring loan
          contribution in all scenarios.
        </p>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={loadReference}>
            Load reference scenario
          </button>
        </div>
        {!parsed.success && (
          <ul className="errors">
            {parsed.error.issues.map((i) => (
              <li key={i.path.join(".")}>{i.message}</li>
            ))}
          </ul>
        )}
      </section>

      {models && (
        <>
          <section className="card">
            <h2>Loan scenario comparison</h2>
            <p className="hint">
              One-time prepay scenarios use{" "}
              <strong>
                {models.prepaySource === "cash" ? "Cash" : "PF account"}
              </strong>{" "}
              at end of month 1. Monthly column uses your{" "}
              <strong>Monthly cash to loan</strong> value.
            </p>
            <label className="inline">
              One-time prepay source{" "}
              <select
                value={prepaySource}
                onChange={(e) => setPrepaySource(e.target.value as PrepaySource)}
              >
                <option value="cash">Cash</option>
                <option value="pf">PF account</option>
              </select>
            </label>
            <div className="table-wrap comparison">
              <table>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Payoff (months)</th>
                    <th>Faster vs BASE</th>
                    <th>Total interest</th>
                    <th>Total paid</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>{row.payoffMonth}</td>
                      <td>
                        {row.deltaVsBaseMonths === 0
                          ? "—"
                          : `${row.deltaVsBaseMonths} mo`}
                      </td>
                      <td>{formatInr(row.totalInterest)}</td>
                      <td>{formatInr(row.totalPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Loan baseline summary</h2>
            <dl className="kpi">
              <div>
                <dt>EMI</dt>
                <dd>{formatInr(models.base.emi_inr)}</dd>
              </div>
              <div>
                <dt>Total interest</dt>
                <dd>{formatInr(models.base.totals.total_interest_inr)}</dd>
              </div>
              <div>
                <dt>Liquid assets</dt>
                <dd>
                  {formatInr(
                    models.v.cash_inr + models.v.pf_corpus_inr + models.v.gold_liquid_inr,
                  )}
                </dd>
              </div>
              {pfWithdrawalPlan && (
                <>
                  <div>
                    <dt>PF tranche (month 1)</dt>
                    <dd>{formatInr(pfWithdrawalPlan.tranche1_inr)}</dd>
                  </div>
                  <div>
                    <dt>PF tranche (month 12)</dt>
                    <dd>{formatInr(pfWithdrawalPlan.tranche2_inr)}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <section className="card">
            <div className="schedule-head">
              <h2>Loan amortisation schedule</h2>
              <label className="inline">
                View{" "}
                <select
                  value={scenarioView}
                  onChange={(e) => setScenarioView(e.target.value as ScenarioView)}
                >
                  <option value="BASE">Baseline (no one-time prepay)</option>
                  {models.baseInflow && (
                    <option value="BASE_INFLOW">Baseline + monthly cashflow</option>
                  )}
                  {models.canPrepay && (
                    <>
                      <option value="PREPAY_TENURE">
                        One-time prepay (
                        {models.prepaySource === "cash" ? "Cash" : "PF"}) + keep
                        tenure
                      </option>
                      <option value="PREPAY_EMI">
                        One-time prepay (
                        {models.prepaySource === "cash" ? "Cash" : "PF"}) + keep
                        EMI
                      </option>
                    </>
                  )}
                  {models.prepayEmiInflow && (
                    <option value="PREPAY_EMI_INFLOW">
                      One-time prepay (
                      {models.prepaySource === "cash" ? "Cash" : "PF"}) + keep EMI +
                      monthly cashflow
                    </option>
                  )}
                  {models.cashflowNoPf && (
                    <option value="CASHFLOW_NO_PF">
                      Cash-only prepay + monthly cashflow
                    </option>
                  )}
                  {models.cashflowPlusPf && (
                    <option value="CASHFLOW_PLUS_PF">
                      Cash + monthly cashflow + PF layered
                    </option>
                  )}
                  {models.uePfToLoan && (
                    <option value="UE_PF_TO_LOAN">Unemployment: PF to loan</option>
                  )}
                </select>
              </label>
            </div>
            <ScenarioTable rows={activeRows} />
          </section>
        </>
      )}

      <section className="card">
        <h2>Debt payoff planner</h2>
        <div className="form-grid">
          <label>
            Start date
            <input
              type="date"
              value={startDateIso}
              onChange={(event) => setStartDateIso(event.target.value)}
            />
          </label>
          <label>
            Monthly debt budget (INR)
            <input
              inputMode="decimal"
              value={monthlyBudgetInr}
              onChange={(event) => setMonthlyBudgetInr(event.target.value)}
            />
          </label>
          <label>
            Schedule view
            <select
              value={selectedDebtStrategy}
              onChange={(event) =>
                setSelectedDebtStrategy(event.target.value as DebtStrategy)
              }
            >
              <option value="avalanche">Avalanche</option>
              <option value="snowball">Snowball</option>
            </select>
          </label>
        </div>

        <div className="table-wrap comparison debt-input-table">
          <table>
            <thead>
              <tr>
                <th>Debt</th>
                <th>Balance</th>
                <th>APR (%)</th>
                <th>Minimum payment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {debtRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      value={row.name}
                      onChange={(event) =>
                        setDebtField(row.id, "name", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      value={row.balance_inr}
                      onChange={(event) =>
                        setDebtField(row.id, "balance_inr", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      value={row.apr_pct}
                      onChange={(event) =>
                        setDebtField(row.id, "apr_pct", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      value={row.minimum_payment_inr}
                      onChange={(event) =>
                        setDebtField(
                          row.id,
                          "minimum_payment_inr",
                          event.target.value,
                        )
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => removeDebt(row.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={addDebt}>
            Add debt
          </button>
        </div>
        {activeDebtModel.warning && (
          <p className="hint warning">{activeDebtModel.warning}</p>
        )}
      </section>

      <section className="card">
        <h2>Debt strategy comparison</h2>
        <div className="table-wrap comparison">
          <table>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Payoff months</th>
                <th>Payoff date</th>
                <th>Total interest</th>
                <th>Total paid</th>
              </tr>
            </thead>
            <tbody>
              {[debtModels.avalanche, debtModels.snowball].map((model) => (
                <tr key={model.strategy}>
                  <td>{model.strategy === "avalanche" ? "Avalanche" : "Snowball"}</td>
                  <td>{model.summary.is_paid_off ? model.summary.payoff_months : "—"}</td>
                  <td>{model.summary.payoff_date_iso ?? "—"}</td>
                  <td>{formatInr(model.summary.total_interest_inr)}</td>
                  <td>{formatInr(model.summary.total_paid_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="schedule-head">
          <h2>Debt payoff timeline ({selectedDebtStrategy})</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Opening debt</th>
                <th>Interest</th>
                <th>Payment</th>
                <th>Closing debt</th>
                <th>Next focus</th>
              </tr>
            </thead>
            <tbody>
              {activeDebtModel.rows.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{formatInr(row.opening_total_inr)}</td>
                  <td>{formatInr(row.interest_inr)}</td>
                  <td>{formatInr(row.payment_inr)}</td>
                  <td>{formatInr(row.closing_total_inr)}</td>
                  <td>{row.focus_debt_name ?? "Paid off"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Retirement planner</h2>
        <div className="form-grid">
          <label>
            Current corpus (INR)
            <input
              inputMode="decimal"
              value={retirementInputs.current_corpus_inr}
              onChange={(event) => setRetirementField("current_corpus_inr", event)}
            />
          </label>
          <label>
            Monthly contribution (INR)
            <input
              inputMode="decimal"
              value={retirementInputs.monthly_contribution_inr}
              onChange={(event) =>
                setRetirementField("monthly_contribution_inr", event)
              }
            />
          </label>
          <label>
            Annual return (%)
            <input
              inputMode="decimal"
              value={retirementInputs.annual_return_pct}
              onChange={(event) => setRetirementField("annual_return_pct", event)}
            />
          </label>
          <label>
            Inflation (%)
            <input
              inputMode="decimal"
              value={retirementInputs.inflation_pct}
              onChange={(event) => setRetirementField("inflation_pct", event)}
            />
          </label>
          <label>
            Years to retirement
            <input
              inputMode="numeric"
              value={retirementInputs.years_to_retirement}
              onChange={(event) => setRetirementField("years_to_retirement", event)}
            />
          </label>
          <label>
            Annual expense today (INR)
            <input
              inputMode="decimal"
              value={retirementInputs.annual_expense_today_inr}
              onChange={(event) =>
                setRetirementField("annual_expense_today_inr", event)
              }
            />
          </label>
          <label>
            Safe withdrawal rate (%)
            <input
              inputMode="decimal"
              value={retirementInputs.safe_withdrawal_rate_pct}
              onChange={(event) =>
                setRetirementField("safe_withdrawal_rate_pct", event)
              }
            />
          </label>
          <label>
            Yearly timeline scenario
            <select
              value={selectedRetirementScenario}
              onChange={(event) => setSelectedRetirementScenario(event.target.value)}
            >
              {retirementScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Retirement scenarios</h2>
        <div className="table-wrap comparison">
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Assumptions</th>
                <th>Projected corpus</th>
                <th>Inflation-adjusted corpus</th>
                <th>Expense at retirement</th>
                <th>Target corpus</th>
                <th>Funded ratio</th>
              </tr>
            </thead>
            <tbody>
              {retirementScenarios.map((scenario) => (
                <tr key={scenario.id}>
                  <td>{scenario.label}</td>
                  <td>
                    Return {scenario.assumptions.annual_return_pct}% / Inflation{" "}
                    {scenario.assumptions.inflation_pct}% / SIP{" "}
                    {formatInr(scenario.assumptions.monthly_contribution_inr)}
                  </td>
                  <td>{formatInr(scenario.projection.projected_corpus_inr)}</td>
                  <td>{formatInr(scenario.projection.projected_real_corpus_inr)}</td>
                  <td>
                    {formatInr(scenario.projection.annual_expense_at_retirement_inr)}
                  </td>
                  <td>{formatInr(scenario.projection.target_corpus_inr)}</td>
                  <td>{formatPercent(scenario.projection.funded_ratio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Retirement yearly corpus timeline ({activeRetirementScenario.label})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Nominal corpus</th>
                <th>Real corpus (today INR)</th>
              </tr>
            </thead>
            <tbody>
              {activeRetirementScenario.projection.yearly.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{formatInr(row.corpus_nominal_inr)}</td>
                  <td>{formatInr(row.corpus_real_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="footer">
        Educational planning only. EPF withdrawal eligibility, taxes, lender
        prepayment charges, and loan terms vary. Verify with EPFO, your lender, and
        a qualified financial adviser (SPEC §14).
      </footer>
    </div>
  );
}
