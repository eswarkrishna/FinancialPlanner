import { formatMoneyFinite, formatMoneyKpi } from "../../lib/locale/formatMoney";
import { buildRetirementCorpusCurve } from "../../lib/loan/chartData";
import { AlertCallout } from "../../components/AlertCallout";
import { KpiStrip } from "../../components/KpiStrip";
import { LineChart } from "../../components/LineChart";
import { TableWrap } from "../../components/TableWrap";
import { useLocale } from "../locale/LocaleContext";
import { usePpfCalculator } from "./hooks/usePpfCalculator";

export function PpfSection() {
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
    exportPpfTimelineCsv,
    exportPpfJson,
    minAccountYears,
  } = usePpfCalculator();

  const kpiItems = [
    {
      id: "maturity",
      label: "Maturity value",
      value: moneyKpi(projection.maturity_value_inr),
      tone: "positive" as const,
    },
    {
      id: "contributed",
      label: "Total contributed",
      value: moneyKpi(projection.total_contributed_inr),
    },
    {
      id: "interest",
      label: "Total interest",
      value: moneyKpi(projection.total_interest_inr),
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
      <KpiStrip items={kpiItems} ariaLabel="PPF key metrics" />

      {warningMessages.length > 0 && (
        <AlertCallout title="PPF warnings" messages={warningMessages} tone="warning" />
      )}

      {!isIndia && (
        <AlertCallout
          title="India-specific instrument"
          messages={[
            "Public Provident Fund (PPF) is a government-backed savings scheme for Indian residents. Amounts are shown in INR for illustration.",
          ]}
          tone="warning"
        />
      )}

      <section className="card">
        <div className="schedule-head">
          <h2>PPF maturity calculator</h2>
          <div className="actions inline-actions">
            <button
              type="button"
              className="btn secondary btn-sm"
              onClick={exportPpfTimelineCsv}
              disabled={yearsInvalid || projection.yearly.length === 0}
            >
              Export CSV
            </button>
            <button type="button" className="btn secondary btn-sm" onClick={exportPpfJson}>
              Export JSON
            </button>
          </div>
        </div>
        <p className="hint trust-note">
          <strong>Methodology:</strong> annual contribution at the start of each year, interest
          compounded once per year at your entered rate. This simplified model does not apply the
          monthly “lowest balance between 5th and last day” rule. Verify the latest government-notified
          rate on the NSC or India Post website before planning.
        </p>
        <p className="hint">
          PPF accounts have a {minAccountYears}-year minimum term (extendable in blocks). Section 80C
          tax benefits and partial withdrawal rules are not modelled here — pair with the{" "}
          <strong>Retirement</strong> tab for broader corpus planning.
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
            Annual contribution (INR)
            <input
              inputMode="decimal"
              value={form.annual_contribution_inr}
              onChange={(event) => setField("annual_contribution_inr", event)}
            />
          </label>
          <label>
            Interest rate (% p.a.)
            <input
              inputMode="decimal"
              value={form.interest_rate_pct}
              onChange={(event) => setField("interest_rate_pct", event)}
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
            <h2>Balance growth</h2>
            <LineChart
              title="PPF balance growth"
              points={chartPoints}
              stroke="#0d9488"
              xLabel="Year"
              yLabel="Balance"
              locale={locale}
            />
          </section>

          <section className="card">
            <h2>Yearly timeline</h2>
            <TableWrap label="PPF yearly timeline">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Opening</th>
                    <th scope="col">Contribution</th>
                    <th scope="col">Interest</th>
                    <th scope="col">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.yearly.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{money(row.opening_inr)}</td>
                      <td>{money(row.contribution_inr)}</td>
                      <td>{money(row.interest_inr)}</td>
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
