import { formatMoneyFinite, formatMoneyKpi } from "../../lib/locale/formatMoney";
import { buildRetirementCorpusCurve } from "../../lib/loan/chartData";
import { AlertCallout } from "../../components/AlertCallout";
import { KpiStrip } from "../../components/KpiStrip";
import { LineChart } from "../../components/LineChart";
import { TableWrap } from "../../components/TableWrap";
import { useLocale } from "../locale/LocaleContext";
import { useSipCalculator } from "./hooks/useSipCalculator";

export function SipSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoneyFinite(value, locale);
  const moneyKpi = (value: number) => formatMoneyKpi(value, locale);
  const isIndia = locale === "IN";
  const {
    form,
    projection,
    yearsInvalid,
    warningMessages,
    setField,
    exportSipTimelineCsv,
    exportSipJson,
  } = useSipCalculator();

  const kpiItems = [
    {
      id: "maturity",
      label: "Maturity value",
      value: moneyKpi(projection.maturity_value_inr),
      tone: "positive" as const,
    },
    {
      id: "invested",
      label: "Total invested",
      value: moneyKpi(projection.total_invested_inr),
    },
    {
      id: "gains",
      label: "Total gains",
      value: moneyKpi(projection.total_gains_inr),
      tone: "positive" as const,
    },
  ];

  const chartPoints = buildRetirementCorpusCurve(
    projection.yearly.map((row) => ({
      year: row.year,
      corpus_nominal_inr: row.closing_inr,
      corpus_real_inr: row.closing_inr,
    })),
  );

  return (
    <>
      <KpiStrip items={kpiItems} ariaLabel="SIP key metrics" />

      {warningMessages.length > 0 && (
        <AlertCallout title="SIP warnings" messages={warningMessages} tone="warning" />
      )}

      {!isIndia && (
        <AlertCallout
          title="Illustrative model"
          messages={[
            "This SIP calculator uses INR amounts and an illustrative annual return. For US/UK, treat it as monthly dollar-cost averaging into a brokerage account — not fund-specific advice.",
          ]}
          tone="warning"
        />
      )}

      <section className="card">
        <div className="schedule-head">
          <h2>SIP calculator</h2>
          <div className="actions inline-actions">
            <button
              type="button"
              className="btn secondary btn-sm"
              onClick={exportSipTimelineCsv}
              disabled={yearsInvalid || projection.yearly.length === 0}
            >
              Export CSV
            </button>
            <button type="button" className="btn secondary btn-sm" onClick={exportSipJson}>
              Export JSON
            </button>
          </div>
        </div>
        <p className="hint trust-note">
          <strong>Methodology:</strong> fixed monthly instalment after each month&apos;s growth at
          nominal monthly rate (annual return ÷ 12). Returns are illustrative — not a forecast.
          Expense ratios, taxes, and exit loads are not modelled.
        </p>
        <p className="hint">
          Pair with the <strong>Retirement</strong> tab for inflation-adjusted corpus targets, or{" "}
          <strong>PPF</strong> for government-backed savings. Step-up SIP and fund-specific TER are
          out of scope.
        </p>
        <div className="form-grid">
          <label>
            Opening balance (INR)
            <input
              inputMode="decimal"
              value={form.opening_balance_inr}
              onChange={(event) => setField("opening_balance_inr", event)}
            />
          </label>
          <label>
            Monthly SIP (INR)
            <input
              inputMode="decimal"
              value={form.monthly_investment_inr}
              onChange={(event) => setField("monthly_investment_inr", event)}
            />
          </label>
          <label>
            Expected return (% p.a.)
            <input
              inputMode="decimal"
              value={form.expected_annual_return_pct}
              onChange={(event) => setField("expected_annual_return_pct", event)}
            />
          </label>
          <label>
            Years to project
            <input
              inputMode="numeric"
              value={form.years}
              onChange={(event) => setField("years", event)}
            />
          </label>
        </div>
        {yearsInvalid && (
          <p className="hint warning">Enter at least 1 year to run the projection.</p>
        )}
      </section>

      {!yearsInvalid && projection.yearly.length > 0 && (
        <>
          <section className="card">
            <h2>Corpus growth</h2>
            <LineChart
              title="SIP corpus growth"
              points={chartPoints}
              stroke="#2563eb"
              xLabel="Year"
              yLabel="Corpus"
              locale={locale}
            />
          </section>

          <section className="card">
            <h2>Yearly timeline</h2>
            <TableWrap label="SIP yearly timeline">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Opening</th>
                    <th scope="col">Invested</th>
                    <th scope="col">Gains</th>
                    <th scope="col">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.yearly.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{money(row.opening_inr)}</td>
                      <td>{money(row.contribution_inr)}</td>
                      <td>{money(row.gains_inr)}</td>
                      <td>{money(row.closing_inr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </section>
        </>
      )}
    </>
  );
}
