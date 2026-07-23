import { formatMoney, formatMoneyKpi } from "../../lib/locale/formatMoney";
import { DEFAULT_SAFE_WITHDRAWAL_RATE_PCT } from "../../lib/retirement/constants";
import { trackRetirementScenarioSelect } from "../../lib/analytics";
import { buildRetirementCorpusCurve } from "../../lib/loan/chartData";
import { AlertCallout } from "../../components/AlertCallout";
import { KpiStrip } from "../../components/KpiStrip";
import { LineChart } from "../../components/LineChart";
import { TableWrap } from "../../components/TableWrap";
import { useLocale } from "../locale/LocaleContext";
import { useRetirementPlanner } from "./hooks/useRetirementPlanner";

export function RetirementSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoney(value, locale);
  const moneyKpi = (value: number) => formatMoneyKpi(value, locale);
  const isUs = locale === "US";
  const isUk = locale === "UK";
  const currencyLabel = isUk ? "GBP" : isUs ? "USD" : "INR";
  const {
    retirementInputs,
    selectedRetirementScenario,
    setSelectedRetirementScenario,
    retirementScenarios,
    activeRetirementScenario,
    setRetirementField,
    formatPercent,
    yearsInvalid,
    drawdownProjection,
    effectiveMonthlyWithdrawal,
    effectivePostRetirementReturn,
    annualSsIncome,
    exportRetirementTimelineCsv,
    exportRetirementDrawdownCsv,
    exportRetirementJson,
    importRetirementJson,
    importError,
  } = useRetirementPlanner();

  const drawdownKpiItems =
    activeRetirementScenario && drawdownProjection
      ? [
          {
            id: "corpus",
            label: "Corpus at retirement",
            value: moneyKpi(activeRetirementScenario.projection.projected_corpus_inr),
          },
          {
            id: "withdrawal",
            label: "Monthly withdrawal",
            value: moneyKpi(effectiveMonthlyWithdrawal),
          },
          {
            id: "longevity",
            label: "Corpus lasts",
            value: drawdownProjection.lasts_indefinitely
              ? `${drawdownProjection.max_years}+ years`
              : `${drawdownProjection.depletion_year} years`,
            tone: drawdownProjection.lasts_indefinitely
              ? ("positive" as const)
              : undefined,
          },
        ]
      : [];

  const drawdownChartPoints = drawdownProjection
    ? buildRetirementCorpusCurve(
        drawdownProjection.yearly.map((row) => ({
          year: row.year,
          corpus_nominal_inr: row.closing_inr,
          corpus_real_inr: row.closing_inr,
        })),
      )
    : [];

  const drawdownWarningMessages =
    drawdownProjection?.warnings.map((code) => {
      if (code === "DRAWDOWN_NO_CORPUS") {
        return "Projected corpus at retirement is zero — drawdown cannot be modelled.";
      }
      return "Enter a monthly withdrawal greater than zero to model drawdown.";
    }) ?? [];

  return (
    <>
      <section className="card">
        <h2>Retirement planner</h2>
        <p className="hint trust-note">
          <strong>Methodology:</strong> monthly corpus growth at annual return ÷ 12, then your
          contribution; inflation adjusts the target corpus. Post-retirement drawdown models
          monthly withdrawals against the projected corpus. Illustrative scenarios — not tax or
          pension-rule specific.
        </p>
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
          {(isUs || isUk) && (
            <label>
              {isUk
                ? "Expected State Pension (GBP/wk)"
                : "Expected Social Security (USD/mo)"}
              <input
                inputMode="decimal"
                placeholder={isUk ? "241.30" : "2000"}
                value={retirementInputs.expected_social_security_monthly_inr}
                onChange={(event) =>
                  setRetirementField("expected_social_security_monthly_inr", event)
                }
              />
            </label>
          )}
          <label>
            Monthly withdrawal after retirement ({currencyLabel})
            <input
              inputMode="decimal"
              placeholder="Auto from expense at retirement"
              value={retirementInputs.monthly_withdrawal_inr}
              onChange={(event) => setRetirementField("monthly_withdrawal_inr", event)}
            />
          </label>
          <label>
            Post-retirement return (%)
            <input
              inputMode="decimal"
              placeholder="Same as accumulation scenario"
              value={retirementInputs.post_retirement_return_pct}
              onChange={(event) =>
                setRetirementField("post_retirement_return_pct", event)
              }
            />
          </label>
          <label>
            Yearly timeline scenario
            <select
              value={selectedRetirementScenario}
              disabled={yearsInvalid || retirementScenarios.length === 0}
              onChange={(event) => {
                const next = event.target.value;
                setSelectedRetirementScenario(next);
                trackRetirementScenarioSelect(next);
              }}
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
          {DEFAULT_SAFE_WITHDRAWAL_RATE_PCT}% default.
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
        <TableWrap label="Retirement scenario comparison" className="comparison">
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
                {(isUs || isUk) && annualSsIncome > 0 && (
                  <>
                    <th>{isUk ? "Annual State Pension" : "Annual SS income"}</th>
                    <th>{isUk ? "SP-adjusted target" : "SS-adjusted target"}</th>
                    <th>{isUk ? "SP-adjusted funded" : "SS-adjusted funded"}</th>
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
                  {(isUs || isUk) && annualSsIncome > 0 && (
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
        </TableWrap>
        )}
      </section>

      <section className="card">
        <div className="schedule-head">
          <h2>
            Retirement yearly corpus timeline (
            {activeRetirementScenario?.label ?? "—"})
          </h2>
          {!yearsInvalid && activeRetirementScenario && (
            <div className="actions inline-actions">
              <label className="btn secondary btn-sm">
                Import JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importRetirementJson(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                className="btn secondary btn-sm"
                onClick={exportRetirementTimelineCsv}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="btn secondary btn-sm"
                onClick={exportRetirementJson}
              >
                Export JSON
              </button>
            </div>
          )}
        </div>
        {importError ? <p className="error">{importError}</p> : null}
        {yearsInvalid || !activeRetirementScenario ? (
          <p className="hint">Enter valid years to retirement to see the yearly timeline.</p>
        ) : (
        <>
        <LineChart
          title="Nominal corpus growth"
          points={buildRetirementCorpusCurve(activeRetirementScenario.projection.yearly)}
          stroke="#7c3aed"
          yLabel="Corpus"
          xLabel="Year"
          locale={locale}
        />
        <TableWrap label="Retirement yearly corpus timeline">
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
        </TableWrap>
        </>
        )}
      </section>

      {!yearsInvalid && activeRetirementScenario && drawdownProjection && (
        <>
          {drawdownKpiItems.length > 0 && (
            <KpiStrip items={drawdownKpiItems} ariaLabel="Retirement drawdown metrics" />
          )}

          {drawdownWarningMessages.length > 0 && (
            <AlertCallout
              title="Drawdown warnings"
              messages={drawdownWarningMessages}
              tone="warning"
            />
          )}

          <section className="card">
            <div className="schedule-head">
              <h2>
                Post-retirement drawdown ({activeRetirementScenario.label})
              </h2>
              {drawdownProjection.yearly.length > 0 && (
                <div className="actions inline-actions">
                  <button
                    type="button"
                    className="btn secondary btn-sm"
                    onClick={exportRetirementDrawdownCsv}
                  >
                    Export drawdown CSV
                  </button>
                </div>
              )}
            </div>
            <p className="hint">
              Withdrawal defaults to monthly expense at retirement
              {annualSsIncome > 0 ? " minus pension income" : ""} (
              {money(effectiveMonthlyWithdrawal)}/mo). Post-retirement return defaults to{" "}
              {effectivePostRetirementReturn}% unless overridden.
            </p>
            {drawdownProjection.lasts_indefinitely ? (
              <p className="hint">
                Corpus remains positive through the {drawdownProjection.max_years}-year
                drawdown horizon — withdrawal is below sustained growth at this return rate.
              </p>
            ) : (
              <p className="hint">
                Corpus depletes in year {drawdownProjection.depletion_year} after retirement at
                the entered withdrawal and return assumptions.
              </p>
            )}
            {drawdownProjection.yearly.length > 0 && (
              <>
                <LineChart
                  title="Corpus during drawdown"
                  points={drawdownChartPoints}
                  stroke="#0d9488"
                  yLabel="Corpus"
                  xLabel="Years after retirement"
                  locale={locale}
                />
                <TableWrap label="Post-retirement drawdown timeline">
                  <table>
                    <thead>
                      <tr>
                        <th>Year after retirement</th>
                        <th>Opening</th>
                        <th>Growth</th>
                        <th>Withdrawals</th>
                        <th>Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drawdownProjection.yearly.map((row) => (
                        <tr key={row.year}>
                          <td>{row.year}</td>
                          <td>{money(row.opening_inr)}</td>
                          <td>{money(row.growth_inr)}</td>
                          <td>{money(row.withdrawals_inr)}</td>
                          <td>{money(row.closing_inr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}
