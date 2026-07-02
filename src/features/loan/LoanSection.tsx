import { formatMoney } from "../../lib/locale/formatMoney";
import { useLocale } from "../locale/LocaleContext";
import { ScheduleChart } from "./components/ScheduleChart";
import { ScenarioTable } from "./components/ScenarioTable";
import { StagedPrepayEditor } from "./components/StagedPrepayEditor";
import {
  type PrepaySource,
  type ScenarioView,
  prepaySourceHintLabel,
  prepaySourceScheduleLabel,
  useLoanModels,
} from "./hooks/useLoanModels";

const WARNING_LABELS: Record<string, string> = {
  EMI_DEFAULT_RISK: "EMI default risk: no cash or income while unemployment is on.",
  MORTGAGE_DEFAULT_RISK:
    "Mortgage default risk: no cash, UI, or income while job loss mode is on.",
  CASH_SHORTFALL: "Cash shortfall: payment could not be fully funded from cash balance.",
  EARLY_401K_WITHDRAWAL:
    "Early 401(k) withdrawal costs (penalty/withholding) apply in this scenario.",
  LOAN_NOT_PAID_OFF:
    "Loan balance remains after the simulation horizon; payoff month is not reached.",
};

export function LoanSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoney(value, locale);
  const isUs = locale === "US";
  const {
    inputs,
    setField,
    setBoolField,
    loadReference,
    parsed,
    models,
    comparisonRows,
    withdrawalPlan,
    activeRows,
    activeCashBalances,
    activeWarnings,
    principalCurve,
    interestCurve,
    scenarioView,
    setScenarioView,
    prepaySource,
    setPrepaySource,
    effectiveLiquidInr,
    stagedPrepays,
    addStagedPrepay,
    removeStagedPrepay,
    updateStagedPrepay,
    exportScheduleCsv,
    exportScenarioJson,
  } = useLoanModels();

  const goldHaircutOn = inputs.gold_haircut_enabled === "true";
  const unemploymentOn = inputs.unemployment_mode === "true";
  const currencyLabel = isUs ? "USD" : "INR";

  const tranche1 =
    withdrawalPlan && "tranche1_gross_usd" in withdrawalPlan
      ? withdrawalPlan.tranche1_gross_usd
      : withdrawalPlan && "tranche1_inr" in withdrawalPlan
        ? withdrawalPlan.tranche1_inr
        : 0;
  const tranche2 =
    withdrawalPlan && "tranche2_gross_usd" in withdrawalPlan
      ? withdrawalPlan.tranche2_gross_usd
      : withdrawalPlan && "tranche2_inr" in withdrawalPlan
        ? withdrawalPlan.tranche2_inr
        : 0;

  return (
    <>
      <section className="card">
        <h2>Loan &amp; assets</h2>
        <div className="form-grid">
          <label>
            Principal ({currencyLabel})
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
            Start date (optional)
            <input
              type="date"
              value={inputs.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
            />
          </label>
          <label>
            Monthly {isUs ? "payment" : "cash"} to loan ({currencyLabel})
            <input
              inputMode="decimal"
              value={inputs.monthly_cash_to_loan_inr}
              onChange={(e) => setField("monthly_cash_to_loan_inr", e.target.value)}
            />
          </label>
          <label>
            Cash ({currencyLabel})
            <input
              inputMode="decimal"
              value={inputs.cash_inr}
              onChange={(e) => setField("cash_inr", e.target.value)}
            />
          </label>
          <label>
            Monthly salary ({currencyLabel})
            <input
              inputMode="decimal"
              value={inputs.monthly_salary_inr}
              onChange={(e) => setField("monthly_salary_inr", e.target.value)}
            />
          </label>
          {isUs && (
            <>
              <label>
                Employment type
                <select
                  value={inputs.employment_type}
                  onChange={(e) => setField("employment_type", e.target.value)}
                >
                  <option value="w2">W-2 employee</option>
                  <option value="self_employed">Self-employed / 1099</option>
                </select>
              </label>
              <label>
                Annual salary (USD)
                <input
                  inputMode="decimal"
                  value={inputs.annual_salary_inr}
                  onChange={(e) => setField("annual_salary_inr", e.target.value)}
                />
              </label>
              <label>
                PMI monthly (USD)
                <input
                  inputMode="decimal"
                  value={inputs.pmi_monthly_inr}
                  onChange={(e) => setField("pmi_monthly_inr", e.target.value)}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inputs.pmi_active === "true"}
                  onChange={(e) => setBoolField("pmi_active", e.target.checked)}
                />
                PMI active
              </label>
            </>
          )}
          <label>
            {isUs ? "401(k) vested balance (USD)" : "PF corpus (INR)"}
            <input
              inputMode="decimal"
              value={inputs.pf_corpus_inr}
              onChange={(e) => setField("pf_corpus_inr", e.target.value)}
            />
          </label>
          {isUs ? (
            <>
              <label>
                Vested (%)
                <input
                  inputMode="decimal"
                  value={inputs.vested_fraction_pct}
                  onChange={(e) => setField("vested_fraction_pct", e.target.value)}
                />
              </label>
              <label>
                Monthly 401(k) deferral (USD)
                <input
                  inputMode="decimal"
                  value={inputs.monthly_pf_addition_inr}
                  onChange={(e) => setField("monthly_pf_addition_inr", e.target.value)}
                />
              </label>
              {models && models.monthly401kWithMatch > models.v.monthly_pf_addition_inr && (
                <p className="field-hint">
                  Total monthly 401(k) incl. employer match:{" "}
                  {money(models.monthly401kWithMatch)}
                </p>
              )}
            </>
          ) : (
            <>
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
                  onChange={(e) =>
                    setField("monthly_pf_addition_inr", e.target.value)
                  }
                />
              </label>
            </>
          )}
          <label>
            {isUs ? "Brokerage liquid (USD)" : "Gold liquid (INR)"}
            <input
              inputMode="decimal"
              value={inputs.gold_liquid_inr}
              onChange={(e) => setField("gold_liquid_inr", e.target.value)}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={goldHaircutOn}
              onChange={(e) => setBoolField("gold_haircut_enabled", e.target.checked)}
            />
            {isUs ? "Apply brokerage haircut" : "Apply gold haircut"}
          </label>
          {goldHaircutOn && (
            <label>
              {isUs ? "Brokerage haircut (%)" : "Gold haircut (%)"}
              <input
                inputMode="decimal"
                value={inputs.gold_haircut_pct}
                onChange={(e) => setField("gold_haircut_pct", e.target.value)}
              />
            </label>
          )}
        </div>

        <h3 className="subsection-title">
          {isUs ? "Job loss & cashflow" : "Unemployment & cashflow"}
        </h3>
        <div className="form-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={unemploymentOn}
              onChange={(e) => setBoolField("unemployment_mode", e.target.checked)}
            />
            {isUs ? "Job loss mode" : "Unemployment mode"}
          </label>
          {unemploymentOn && (
            <>
              <label>
                {isUs ? "Job loss start month" : "Unemployment start month"}
                <input
                  inputMode="numeric"
                  value={inputs.unemployment_start_month}
                  onChange={(e) => setField("unemployment_start_month", e.target.value)}
                />
              </label>
              <label>
                Monthly living expense ({currencyLabel})
                <input
                  inputMode="decimal"
                  value={inputs.monthly_living_expense_inr}
                  onChange={(e) => setField("monthly_living_expense_inr", e.target.value)}
                />
              </label>
              <label>
                Monthly income ({currencyLabel})
                <input
                  inputMode="decimal"
                  value={inputs.monthly_income_inr}
                  onChange={(e) => setField("monthly_income_inr", e.target.value)}
                />
              </label>
              {isUs && inputs.employment_type !== "self_employed" && (
                <label>
                  Monthly UI benefit (USD)
                  <input
                    inputMode="decimal"
                    value={inputs.monthly_uib_inr}
                    onChange={(e) => setField("monthly_uib_inr", e.target.value)}
                  />
                </label>
              )}
              {isUs && (
                <>
                  <label>
                    HSA balance (USD)
                    <input
                      inputMode="decimal"
                      value={inputs.hsa_balance_inr}
                      onChange={(e) => setField("hsa_balance_inr", e.target.value)}
                    />
                  </label>
                  <label>
                    Monthly health premium (USD)
                    <input
                      inputMode="decimal"
                      value={inputs.monthly_health_premium_inr}
                      onChange={(e) =>
                        setField("monthly_health_premium_inr", e.target.value)
                      }
                    />
                  </label>
                </>
              )}
            </>
          )}
        </div>

        {isUs && unemploymentOn && (
          <p className="hint">
            Simplified job-loss scenario — not IRS hardship or plan rules. Early 401(k)
            withdrawals model a 10% penalty plus federal withholding.
          </p>
        )}

        <p className="hint">
          <strong>Monthly cash to loan:</strong> amount applied as{" "}
          <strong>extra principal</strong> after each month&apos;s scheduled EMI (used in
          monthly-inflow scenarios only).{" "}
          <strong>Monthly salary</strong> is routed as extra principal in salary-sweep
          and prepay scenarios, but <strong>not</strong> in the baseline{" "}
          <strong>BASE</strong> row.{" "}
          <strong>{isUs ? "Brokerage liquid" : "Gold liquid"}</strong> can be the
          one-time prepay source; enable haircut to model liquidation discount.
          {goldHaircutOn && models && (
            <>
              {" "}
              Effective {isUs ? "brokerage" : "gold"} after haircut:{" "}
              <strong>{money(effectiveLiquidInr)}</strong>.
            </>
          )}
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
            <StagedPrepayEditor
              entries={stagedPrepays}
              currencyLabel={currencyLabel}
              onAdd={addStagedPrepay}
              onRemove={removeStagedPrepay}
              onChange={updateStagedPrepay}
            />
          </section>

          <section className="card">
            <h2>Loan scenario comparison</h2>
            <p className="hint">
              One-time prepay scenarios use{" "}
              <strong>{prepaySourceHintLabel(models.prepaySource, locale)}</strong> at end
              of month 1. Monthly-inflow column uses your{" "}
              <strong>Monthly cash to loan</strong> value (salary sweep is listed
              separately).
            </p>
            <label className="inline">
              One-time prepay source{" "}
              <select
                value={prepaySource}
                onChange={(e) => setPrepaySource(e.target.value as PrepaySource)}
              >
                <option value="cash">Cash</option>
                <option value="pf">{isUs ? "401(k) account" : "PF account"}</option>
                <option value="gold">
                  {isUs ? "Brokerage (liquid)" : "Gold (liquid)"}
                </option>
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
                    <th>Δ interest vs BASE</th>
                    <th>Min cash</th>
                    <th>Total paid</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>{row.payoffMonth > 0 ? row.payoffMonth : "—"}</td>
                      <td>
                        {row.deltaVsBaseMonths === 0
                          ? "—"
                          : `${row.deltaVsBaseMonths} mo`}
                      </td>
                      <td>{money(row.totalInterest)}</td>
                      <td>
                        {row.deltaInterestVsBase === 0
                          ? "—"
                          : money(row.deltaInterestVsBase)}
                      </td>
                      <td>
                        {row.minCashBalance !== undefined
                          ? money(row.minCashBalance)
                          : "—"}
                      </td>
                      <td>{money(row.totalPaid)}</td>
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
                <dd>{money(models.base.emi_inr)}</dd>
              </div>
              <div>
                <dt>Total interest</dt>
                <dd>{money(models.base.totals.total_interest_inr)}</dd>
              </div>
              <div>
                <dt>Liquid assets</dt>
                <dd>
                  {money(
                    models.v.cash_inr +
                      models.v.pf_corpus_inr +
                      (goldHaircutOn ? effectiveLiquidInr : models.v.gold_liquid_inr),
                  )}
                </dd>
              </div>
              {withdrawalPlan && (
                <>
                  <div>
                    <dt>
                      {isUs ? "401(k) tranche (month 1)" : "PF tranche (month 1)"}
                    </dt>
                    <dd>{money(tranche1)}</dd>
                  </div>
                  <div>
                    <dt>
                      {isUs ? "401(k) tranche (month 12)" : "PF tranche (month 12)"}
                    </dt>
                    <dd>{money(tranche2)}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <section className="card">
            <div className="schedule-head">
              <h2>Loan amortisation schedule</h2>
              <div className="schedule-head-actions">
                <label className="inline">
                  View{" "}
                  <select
                    value={scenarioView}
                    onChange={(e) => setScenarioView(e.target.value as ScenarioView)}
                  >
                    <option value="BASE">Baseline (no one-time prepay)</option>
                    {models.baseSalarySweep && (
                      <option value="BASE_SALARY_SWEEP">
                        Baseline + monthly salary sweep
                      </option>
                    )}
                    {models.baseInflow && (
                      <option value="BASE_INFLOW">Baseline + monthly cashflow</option>
                    )}
                    {models.canPrepay && (
                      <>
                        <option value="PREPAY_TENURE">
                          One-time prepay (
                          {prepaySourceScheduleLabel(models.prepaySource, locale)}) + keep
                          tenure
                        </option>
                        <option value="PREPAY_EMI">
                          One-time prepay (
                          {prepaySourceScheduleLabel(models.prepaySource, locale)}) + keep
                          EMI
                        </option>
                      </>
                    )}
                    {models.prepayEmiInflow && (
                      <option value="PREPAY_EMI_INFLOW">
                        One-time prepay (
                        {prepaySourceScheduleLabel(models.prepaySource, locale)}) + keep
                        EMI + monthly cashflow
                      </option>
                    )}
                    {models.cashflowNoPf && (
                      <option value="CASHFLOW_NO_PF">
                        Cash-only prepay + monthly cashflow
                      </option>
                    )}
                    {models.cashflowPlusPf && (
                      <option value="CASHFLOW_PLUS_PF">
                        {isUs
                          ? "Cash + monthly cashflow + 401(k) tranches"
                          : "Cash + monthly cashflow + PF tranches"}
                      </option>
                    )}
                    {models.uePfToLoan && (
                      <option value="UE_PF_TO_LOAN">
                        {isUs
                          ? "Job loss: 401(k) to loan"
                          : "Unemployment: PF to loan"}
                      </option>
                    )}
                    {models.uePfBridge && (
                      <option value="UE_PF_BRIDGE">
                        {isUs
                          ? "Job loss: 401(k) bridge"
                          : "Unemployment: PF bridge"}
                      </option>
                    )}
                    {models.ueDelayPrepay && (
                      <option value="UE_DELAY_PREPAY">
                        {isUs
                          ? "Job loss: delay prepay"
                          : "Unemployment: delay prepay"}
                      </option>
                    )}
                    {models.stagedPrepay && (
                      <option value="STAGED_PREPAY">Custom staged prepay</option>
                    )}
                  </select>
                </label>
                <div className="actions inline-actions">
                  <button type="button" className="btn secondary btn-sm" onClick={exportScheduleCsv}>
                    Export CSV
                  </button>
                  <button type="button" className="btn secondary btn-sm" onClick={exportScenarioJson}>
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {activeWarnings.length > 0 && (
              <ul className="errors">
                {activeWarnings.map((w) => (
                  <li key={w}>{WARNING_LABELS[w] ?? w}</li>
                ))}
              </ul>
            )}

            <div className="chart-grid">
              <ScheduleChart
                title="Remaining principal"
                points={principalCurve}
                stroke="#2563eb"
                yLabel={currencyLabel}
                locale={locale}
              />
              <ScheduleChart
                title="Cumulative interest"
                points={interestCurve}
                stroke="#dc2626"
                yLabel={currencyLabel}
                locale={locale}
              />
            </div>

            <ScenarioTable
              rows={activeRows}
              cashBalances={activeCashBalances}
              startDateIso={models.v.start_date}
              locale={locale}
            />
          </section>
        </>
      )}
    </>
  );
}
