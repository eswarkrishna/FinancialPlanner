import { formatMoney } from "../../lib/locale/formatMoney";
import { DEFAULT_SAFE_WITHDRAWAL_RATE_PCT } from "../../lib/retirement/constants";
import { useLocale } from "../locale/LocaleContext";
import { useRetirementPlanner } from "./hooks/useRetirementPlanner";

export function RetirementSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoney(value, locale);
  const isUs = locale === "US";
  const currencyLabel = isUs ? "USD" : "INR";
  const {
    retirementInputs,
    selectedRetirementScenario,
    setSelectedRetirementScenario,
    retirementScenarios,
    activeRetirementScenario,
    setRetirementField,
    formatPercent,
    retirementBaseInput,
    yearsInvalid,
  } = useRetirementPlanner();

  const annualSsIncome =
    (retirementBaseInput?.expected_social_security_monthly_inr ?? 0) * 12;

  return (
    <>
      <section className="card">
        <h2>Retirement planner</h2>
        <div className="form-grid">
          <label>
            Current corpus ({currencyLabel})
            <input
              inputMode="decimal"
              value={retirementInputs.current_corpus_inr}
              onChange={(event) => setRetirementField("current_corpus_inr", event)}
            />
          </label>
          <label>
            Monthly contribution ({currencyLabel})
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
            Annual expense today ({currencyLabel})
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
          {isUs && (
            <label>
              Expected Social Security (USD/mo)
              <input
                inputMode="decimal"
                placeholder="2000"
                value={retirementInputs.expected_social_security_monthly_inr}
                onChange={(event) =>
                  setRetirementField("expected_social_security_monthly_inr", event)
                }
              />
            </label>
          )}
          <label>
            Yearly timeline scenario
            <select
              value={selectedRetirementScenario}
              disabled={yearsInvalid || retirementScenarios.length === 0}
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
        {yearsInvalid && (
          <p className="hint warning">
            Enter years to retirement (at least 1) to run projections.
          </p>
        )}
        <p className="hint">
          <strong>Safe withdrawal %:</strong> leave blank to use the classic{" "}
          {DEFAULT_SAFE_WITHDRAWAL_RATE_PCT}% default (SPEC §4.11).
          {isUs && (
            <>
              {" "}
              <strong>Social Security</strong> is shown separately and does not compound in
              the corpus projection. When SS is entered, <strong>SS-adjusted funded</strong>{" "}
              measures corpus against the expense gap remaining after SS, divided by your SWR.
            </>
          )}
        </p>
      </section>

      <section className="card">
        <h2>Retirement scenarios</h2>
        {yearsInvalid ? (
          <p className="hint">Enter valid years to retirement to see scenario comparison.</p>
        ) : (
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
                {isUs && annualSsIncome > 0 && (
                  <>
                    <th>Annual SS income</th>
                    <th>SS-adjusted target</th>
                    <th>SS-adjusted funded</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {retirementScenarios.map((scenario) => (
                <tr key={scenario.id}>
                  <td>{scenario.label}</td>
                  <td>
                    Return {scenario.assumptions.annual_return_pct}% / Inflation{" "}
                    {scenario.assumptions.inflation_pct}% / SIP{" "}
                    {money(scenario.assumptions.monthly_contribution_inr)}
                  </td>
                  <td>{money(scenario.projection.projected_corpus_inr)}</td>
                  <td>{money(scenario.projection.projected_real_corpus_inr)}</td>
                  <td>
                    {money(scenario.projection.annual_expense_at_retirement_inr)}
                  </td>
                  <td>{money(scenario.projection.target_corpus_inr)}</td>
                  <td>{formatPercent(scenario.projection.funded_ratio)}</td>
                  {isUs && annualSsIncome > 0 && (
                    <>
                      <td>{money(annualSsIncome)}</td>
                      <td>
                        {scenario.projection.ss_adjusted_target_corpus_inr !== undefined
                          ? money(scenario.projection.ss_adjusted_target_corpus_inr)
                          : "—"}
                      </td>
                      <td>
                        {scenario.projection.ss_adjusted_funded_ratio !== undefined
                          ? formatPercent(scenario.projection.ss_adjusted_funded_ratio)
                          : "—"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>

      <section className="card">
        <h2>
          Retirement yearly corpus timeline (
          {activeRetirementScenario?.label ?? "—"})
        </h2>
        {yearsInvalid || !activeRetirementScenario ? (
          <p className="hint">Enter valid years to retirement to see the yearly timeline.</p>
        ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Nominal corpus</th>
                <th>Real corpus (today {currencyLabel})</th>
              </tr>
            </thead>
            <tbody>
              {activeRetirementScenario.projection.yearly.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{money(row.corpus_nominal_inr)}</td>
                  <td>{money(row.corpus_real_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>
    </>
  );
}
