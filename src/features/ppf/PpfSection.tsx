import { formatMoney } from "../../lib/locale/formatMoney";
import { PPF_ANNUAL_CONTRIBUTION_CAP_INR } from "../../lib/ppf/constants";
import type { PpfYearRow } from "../../lib/ppf/project";
import { LineChart } from "../../components/LineChart";
import { TableWrap } from "../../components/TableWrap";
import { useLocale } from "../locale/LocaleContext";
import { usePpfCalculator } from "./hooks/usePpfCalculator";

export function PpfSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoney(value, locale);
  const currencyLabel = locale === "US" ? "USD" : locale === "UK" ? "GBP" : "INR";
  const { form, setField, projection, chartPoints } = usePpfCalculator();

  return (
    <>
      <section className="card">
        <h2>PPF calculator</h2>
        <p className="hint">
          Estimate Public Provident Fund growth with annual contributions and notified interest.
          Verify the current rate and Section 80C rules with official sources — educational only.
        </p>
        <div className="form-grid">
          <label>
            Opening balance ({currencyLabel})
            <input
              inputMode="decimal"
              value={form.opening_balance_inr}
              onChange={(e) => setField("opening_balance_inr", e.target.value)}
            />
          </label>
          <label>
            Annual contribution ({currencyLabel})
            <input
              inputMode="decimal"
              value={form.annual_contribution_inr}
              onChange={(e) => setField("annual_contribution_inr", e.target.value)}
            />
            {locale === "IN" ? (
              <span className="field-hint">
                Statutory cap ₹{PPF_ANNUAL_CONTRIBUTION_CAP_INR.toLocaleString("en-IN")}/year
                (verify current limit).
              </span>
            ) : null}
          </label>
          <label>
            Annual interest rate (%)
            <input
              inputMode="decimal"
              value={form.annual_interest_rate_pct}
              onChange={(e) => setField("annual_interest_rate_pct", e.target.value)}
            />
          </label>
          <label>
            Duration (years)
            <input
              inputMode="numeric"
              value={form.duration_years}
              onChange={(e) => setField("duration_years", e.target.value)}
            />
          </label>
        </div>
      </section>

      {projection ? (
        <>
          <section className="card kpi-strip-card">
            <div className="kpi-strip">
              <div className="kpi">
                <span className="kpi-label">Total contributed</span>
                <span className="kpi-value">{money(projection.total_contributed_inr)}</span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Interest earned</span>
                <span className="kpi-value positive-text">
                  {money(projection.total_interest_inr)}
                </span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Maturity value</span>
                <span className="kpi-value">{money(projection.maturity_value_inr)}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="chart-grid">
              <LineChart
                title="PPF balance by year"
                points={chartPoints}
                stroke="#2563eb"
                yLabel={currencyLabel}
                xLabel="Year"
                locale={locale}
              />
            </div>
            <TableWrap label="Year-by-year schedule" className="comparison">
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Contribution</th>
                    <th>Interest</th>
                    <th>Closing balance</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.yearly.map((row: PpfYearRow) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{money(row.contribution_inr)}</td>
                      <td>{money(row.interest_inr)}</td>
                      <td>{money(row.closing_balance_inr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </section>
        </>
      ) : null}
    </>
  );
}
