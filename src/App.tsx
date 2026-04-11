import { useMemo, useState } from "react";
import {
  baselineSchedule,
  scheduleFixedEmiWithMonthlyExtra,
  schedulePrepayKeepEmi,
  schedulePrepayKeepTenure,
  type ScheduleRow,
} from "./lib/amortisation";
import { formatInr } from "./lib/formatInr";
import { REFERENCE_SCENARIO, loanInputSchema, type LoanInput } from "./lib/loanInputSchema";

type ScenarioView = "BASE" | "PREPAY_TENURE" | "PREPAY_EMI" | "BASE_INFLOW" | "PREPAY_EMI_INFLOW";

const PREPAY_INR = 2_500_000;

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

type ComparisonRow = {
  id: string;
  label: string;
  payoffMonth: number;
  totalInterest: number;
  totalPaid: number;
  deltaVsBaseMonths: number;
};

export function App() {
  const [inputs, setInputs] = useState<Record<keyof LoanInput, string>>({
    principal_inr: String(REFERENCE_SCENARIO.principal_inr),
    annual_interest_rate: String(REFERENCE_SCENARIO.annual_interest_rate),
    tenure_months: String(REFERENCE_SCENARIO.tenure_months),
    cash_inr: String(REFERENCE_SCENARIO.cash_inr),
    pf_corpus_inr: String(REFERENCE_SCENARIO.pf_corpus_inr),
    gold_liquid_inr: String(REFERENCE_SCENARIO.gold_liquid_inr),
    monthly_cash_to_loan_inr: String(REFERENCE_SCENARIO.monthly_cash_to_loan_inr),
  });
  const [scenarioView, setScenarioView] = useState<ScenarioView>("BASE");

  const parsed = useMemo(() => {
    return loanInputSchema.safeParse({
      principal_inr: inputs.principal_inr,
      annual_interest_rate: inputs.annual_interest_rate,
      tenure_months: inputs.tenure_months,
      cash_inr: inputs.cash_inr || 0,
      pf_corpus_inr: inputs.pf_corpus_inr || 0,
      gold_liquid_inr: inputs.gold_liquid_inr || 0,
      monthly_cash_to_loan_inr: inputs.monthly_cash_to_loan_inr || 0,
    });
  }, [inputs]);

  const models = useMemo(() => {
    if (!parsed.success) return null;
    const v = parsed.data;
    const x = v.monthly_cash_to_loan_inr;
    const base = baselineSchedule(v.principal_inr, v.annual_interest_rate, v.tenure_months);
    const canPrepay = v.principal_inr >= PREPAY_INR;
    const prepayTenure = canPrepay
      ? schedulePrepayKeepTenure(v.principal_inr, v.annual_interest_rate, v.tenure_months, 1, PREPAY_INR)
      : null;
    const prepayEmi = canPrepay
      ? schedulePrepayKeepEmi(v.principal_inr, v.annual_interest_rate, v.tenure_months, 1, PREPAY_INR)
      : null;
    const baseInflow =
      x > 0
        ? scheduleFixedEmiWithMonthlyExtra(v.principal_inr, v.annual_interest_rate, v.tenure_months, x)
        : null;
    const prepayEmiInflow =
      canPrepay && x > 0
        ? scheduleFixedEmiWithMonthlyExtra(v.principal_inr, v.annual_interest_rate, v.tenure_months, x, {
            month: 1,
            amount: PREPAY_INR,
          })
        : null;
    return { v, base, prepayTenure, prepayEmi, baseInflow, prepayEmiInflow, canPrepay, monthlyExtra: x };
  }, [parsed]);

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
        label: "Prepay ₹25L + keep tenure",
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
        label: "Prepay ₹25L + keep EMI",
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
        label: `Prepay ₹25L + keep EMI + ${formatInr(models.monthlyExtra)}/mo`,
        payoffMonth: p,
        totalInterest: models.prepayEmiInflow.totals.total_interest_inr,
        totalPaid: models.prepayEmiInflow.totals.total_paid_inr,
        deltaVsBaseMonths: baseM - p,
      });
    }
    return rows;
  }, [models]);

  const activeRows = useMemo(() => {
    if (!models) return [];
    if (scenarioView === "BASE") return models.base.rows;
    if (scenarioView === "PREPAY_TENURE" && models.prepayTenure) return models.prepayTenure.rows;
    if (scenarioView === "PREPAY_EMI" && models.prepayEmi) return models.prepayEmi.rows;
    if (scenarioView === "BASE_INFLOW" && models.baseInflow) return models.baseInflow.rows;
    if (scenarioView === "PREPAY_EMI_INFLOW" && models.prepayEmiInflow) return models.prepayEmiInflow.rows;
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
      pf_corpus_inr: String(REFERENCE_SCENARIO.pf_corpus_inr),
      gold_liquid_inr: String(REFERENCE_SCENARIO.gold_liquid_inr),
      monthly_cash_to_loan_inr: String(REFERENCE_SCENARIO.monthly_cash_to_loan_inr),
    });
    setScenarioView("BASE");
  }

  return (
    <div className="layout">
      <header className="header">
        <h1>FinancialPlanner</h1>
        <p className="lede">
          Reducing-balance loan scenarios, EMI, and amortisation — aligned with{" "}
          <code>docs/SPEC.md</code>.
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
            PF corpus (INR)
            <input
              inputMode="decimal"
              value={inputs.pf_corpus_inr}
              onChange={(e) => setField("pf_corpus_inr", e.target.value)}
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
          <strong>Monthly cash to loan:</strong> amount applied as <strong>extra principal</strong> after each
          month&apos;s scheduled EMI (SPEC §4.5). Does not model living expenses—compare payoff <strong>months</strong>{" "}
          in the table below.
        </p>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={loadReference}>
            Load reference scenario (§15)
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
            <h2>Scenario comparison — time to repay</h2>
            <p className="hint">
              One-time prepay where shown: <strong>{formatInr(PREPAY_INR)}</strong> at end of month 1. Monthly column
              uses your <strong>Monthly cash to loan</strong> value.
            </p>
            <div className="table-wrap comparison">
              <table>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Payoff (months)</th>
                    <th>Faster vs BASE</th>
                    <th>Total interest</th>
                    <th>Total paid (incl. prepay/extra)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>{row.payoffMonth}</td>
                      <td>{row.deltaVsBaseMonths === 0 ? "—" : `${row.deltaVsBaseMonths} mo`}</td>
                      <td>{formatInr(row.totalInterest)}</td>
                      <td>{formatInr(row.totalPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!models.canPrepay && (
              <p className="hint">Prepay scenarios need principal ≥ {formatInr(PREPAY_INR)}.</p>
            )}
            {models.monthlyExtra <= 0 && (
              <p className="hint">Enter <strong>Monthly cash to loan</strong> &gt; 0 to see inflow scenarios.</p>
            )}
          </section>

          <section className="card">
            <h2>Baseline summary</h2>
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
                <dt>Liquid assets (info)</dt>
                <dd>
                  {formatInr(
                    models.v.cash_inr + models.v.pf_corpus_inr + models.v.gold_liquid_inr,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <div className="schedule-head">
              <h2>Amortisation schedule</h2>
              <label className="inline">
                View{" "}
                <select
                  value={scenarioView}
                  onChange={(e) => setScenarioView(e.target.value as ScenarioView)}
                >
                  <option value="BASE">BASE</option>
                  {models.baseInflow && <option value="BASE_INFLOW">BASE + monthly to loan</option>}
                  {models.canPrepay && (
                    <>
                      <option value="PREPAY_TENURE">Prepay + keep tenure</option>
                      <option value="PREPAY_EMI">Prepay + keep EMI</option>
                    </>
                  )}
                  {models.prepayEmiInflow && (
                    <option value="PREPAY_EMI_INFLOW">Prepay + keep EMI + monthly to loan</option>
                  )}
                </select>
              </label>
            </div>
            <ScenarioTable rows={activeRows} />
          </section>
        </>
      )}

      <footer className="footer">
        Educational planning only. EPF withdrawal eligibility, taxes, lender prepayment charges, and
        loan terms vary. Verify with EPFO, your lender, and a qualified financial adviser (SPEC §14).
      </footer>
    </div>
  );
}
