import { useMemo, useState } from "react";
import {
  baselineSchedule,
  schedulePrepayKeepEmi,
  schedulePrepayKeepTenure,
  type ScheduleRow,
} from "./lib/amortisation";
import { formatInr } from "./lib/formatInr";
import { REFERENCE_SCENARIO, loanInputSchema, type LoanInput } from "./lib/loanInputSchema";

type ScenarioView = "BASE" | "PREPAY_TENURE" | "PREPAY_EMI";

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
            <th>Principal</th>
            <th>Prepay</th>
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
    pf_corpus_inr: String(REFERENCE_SCENARIO.pf_corpus_inr),
    gold_liquid_inr: String(REFERENCE_SCENARIO.gold_liquid_inr),
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
    });
  }, [inputs]);

  const models = useMemo(() => {
    if (!parsed.success) return null;
    const v = parsed.data;
    const base = baselineSchedule(v.principal_inr, v.annual_interest_rate, v.tenure_months);
    const canPrepay = v.principal_inr >= PREPAY_INR;
    const prepayTenure = canPrepay
      ? schedulePrepayKeepTenure(v.principal_inr, v.annual_interest_rate, v.tenure_months, 1, PREPAY_INR)
      : null;
    const prepayEmi = canPrepay
      ? schedulePrepayKeepEmi(v.principal_inr, v.annual_interest_rate, v.tenure_months, 1, PREPAY_INR)
      : null;
    return { v, base, prepayTenure, prepayEmi, canPrepay };
  }, [parsed]);

  const activeRows = useMemo(() => {
    if (!models) return [];
    if (scenarioView === "BASE") return models.base.rows;
    if (scenarioView === "PREPAY_TENURE" && models.prepayTenure) return models.prepayTenure.rows;
    if (scenarioView === "PREPAY_EMI" && models.prepayEmi) return models.prepayEmi.rows;
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
            <h2>Scenario comparison</h2>
            <p className="hint">
              Preset prepayment: <strong>{formatInr(PREPAY_INR)}</strong> at end of month 1 (SPEC §4.6
              style).
            </p>
            <div className="table-wrap comparison">
              <table>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Payoff month</th>
                    <th>Total interest</th>
                    <th>Total paid (incl. prepay)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>BASE</td>
                    <td>{models.base.totals.payoff_month}</td>
                    <td>{formatInr(models.base.totals.total_interest_inr)}</td>
                    <td>{formatInr(models.base.totals.total_paid_inr)}</td>
                  </tr>
                  {models.prepayTenure && (
                    <tr>
                      <td>Prepay + keep tenure (§4.4)</td>
                      <td>{models.prepayTenure.totals.payoff_month}</td>
                      <td>{formatInr(models.prepayTenure.totals.total_interest_inr)}</td>
                      <td>{formatInr(models.prepayTenure.totals.total_paid_inr)}</td>
                    </tr>
                  )}
                  {models.prepayEmi && (
                    <tr>
                      <td>Prepay + keep EMI (§4.4)</td>
                      <td>{models.prepayEmi.totals.payoff_month}</td>
                      <td>{formatInr(models.prepayEmi.totals.total_interest_inr)}</td>
                      <td>{formatInr(models.prepayEmi.totals.total_paid_inr)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!models.canPrepay && (
              <p className="hint">Prepay scenarios need principal ≥ {formatInr(PREPAY_INR)}.</p>
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
                  {models.canPrepay && (
                    <>
                      <option value="PREPAY_TENURE">Prepay + keep tenure</option>
                      <option value="PREPAY_EMI">Prepay + keep EMI</option>
                    </>
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
