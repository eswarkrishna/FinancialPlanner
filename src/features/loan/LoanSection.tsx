import { formatInr } from "../../lib/formatInr";
import { ScenarioTable } from "./components/ScenarioTable";
import {
  type PrepaySource,
  type ScenarioView,
  prepaySourceHintLabel,
  prepaySourceScheduleLabel,
  useLoanModels,
} from "./hooks/useLoanModels";

export function LoanSection() {
  const {
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
  } = useLoanModels();

  return (
    <>
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
              onChange={(e) => setField("pf_annual_interest_rate_pct", e.target.value)}
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
          contribution in all scenarios. <strong>Gold liquid</strong> is counted in
          liquid assets and can be chosen as the one-time prepay source below (along
          with cash or PF).
        </p>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={loadReference}>
            Load reference scenario
          </button>
        </div>
        {!parsed.success && (
          <ul className="errors">
            {parsed.error.issues.map((issue) => (
              <li key={issue.path.join(".")}>{issue.message}</li>
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
              <strong>{prepaySourceHintLabel(models.prepaySource)}</strong> at end of
              month 1. Monthly column uses your{" "}
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
                <option value="gold">Gold (liquid)</option>
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
                        {prepaySourceScheduleLabel(models.prepaySource)}) + keep tenure
                      </option>
                      <option value="PREPAY_EMI">
                        One-time prepay (
                        {prepaySourceScheduleLabel(models.prepaySource)}) + keep EMI
                      </option>
                    </>
                  )}
                  {models.prepayEmiInflow && (
                    <option value="PREPAY_EMI_INFLOW">
                      One-time prepay (
                      {prepaySourceScheduleLabel(models.prepaySource)}) + keep EMI +
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
    </>
  );
}
