import { formatMoney } from "../../lib/locale/formatMoney";
import type { SipMonthRow } from "../../lib/sip/project";
import { LineChart } from "../../components/LineChart";
import { TableWrap } from "../../components/TableWrap";
import { useLocale } from "../locale/LocaleContext";
import { useSipCalculator } from "./hooks/useSipCalculator";

export function SipSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoney(value, locale);
  const currencyLabel = locale === "US" ? "USD" : locale === "UK" ? "GBP" : "INR";
  const { form, setField, projection, chartPoints } = useSipCalculator();

  return (
    <>
      <section className="card">
        <h2>SIP calculator</h2>
        <p className="hint">
          Project systematic monthly investments. Returns are hypothetical — mutual fund
          performance varies. Not investment advice.
        </p>
        <div className="form-grid">
          <label>
            Monthly investment ({currencyLabel})
            <input
              inputMode="decimal"
              value={form.monthly_investment_inr}
              onChange={(e) => setField("monthly_investment_inr", e.target.value)}
            />
          </label>
          <label>
            Expected annual return (%)
            <input
              inputMode="decimal"
              value={form.annual_return_pct}
              onChange={(e) => setField("annual_return_pct", e.target.value)}
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
                <span className="kpi-label">Total invested</span>
                <span className="kpi-value">{money(projection.total_invested_inr)}</span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Maturity value</span>
                <span className="kpi-value">{money(projection.maturity_value_inr)}</span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Estimated gains</span>
                <span className="kpi-value positive-text">
                  {money(projection.total_gains_inr)}
                </span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="chart-grid">
              <LineChart
                title="Corpus growth"
                points={chartPoints}
                stroke="#0d9488"
                yLabel={currencyLabel}
                xLabel="Month"
                locale={locale}
              />
            </div>
            <TableWrap label="Yearly milestones" className="comparison">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Invested</th>
                    <th>Corpus</th>
                    <th>Gains</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.monthly
                    .filter((row: SipMonthRow) => row.month % 12 === 0 || row.month === projection.monthly.length)
                    .map((row: SipMonthRow) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td>{money(row.invested_inr)}</td>
                        <td>{money(row.corpus_inr)}</td>
                        <td>{money(row.gains_inr)}</td>
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
