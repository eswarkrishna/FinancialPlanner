import { formatMoneyFinite } from "../../lib/locale/formatMoney";
import { buildBudgetPortfolioCurve } from "../../lib/loan/chartData";
import { AlertCallout } from "../../components/AlertCallout";
import { BarChart } from "../../components/BarChart";
import { KpiStrip } from "../../components/KpiStrip";
import { LineChart } from "../../components/LineChart";
import { TableWrap } from "../../components/TableWrap";
import { useLocale } from "../locale/LocaleContext";
import { useBudgetPlanner } from "./hooks/useBudgetPlanner";
import type { BudgetBucket, InvestmentAssetClass } from "../../lib/budget";

const BUCKET_LABELS: Record<BudgetBucket, string> = {
  need: "Need",
  want: "Want",
  savings: "Savings",
};

const ASSET_CLASS_LABELS: Record<InvestmentAssetClass, string> = {
  equity: "Equity",
  debt: "Debt / bonds",
  gold: "Gold",
  cash: "Cash",
  other: "Other",
};

const EXPENSE_CHART_COLORS = ["#0d9488", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#ca8a04"];

type BucketRowKind = "need" | "want" | "savings";

function bucketDeltaClass(kind: BucketRowKind, actual: number, target: number): string {
  if (kind === "savings") {
    return actual < target ? "warning-text" : "positive-text";
  }
  return actual > target ? "warning-text" : "positive-text";
}

export function BudgetSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoneyFinite(value, locale);
  const currencyLabel = locale === "US" ? "USD" : locale === "UK" ? "GBP" : "INR";
  const {
    form,
    analysis,
    warningMessages,
    importError,
    setMonthLabel,
    setEmergencyFund,
    setProjectionMonths,
    setIncomeField,
    setExpenseField,
    setInvestmentField,
    addIncomeLine,
    removeIncomeLine,
    addExpenseLine,
    removeExpenseLine,
    addInvestment,
    removeInvestment,
    loadReferenceBudget,
    exportBudgetSummaryCsv,
    exportBudgetJson,
    importBudgetJson,
  } = useBudgetPlanner();

  const { summary, investment_projection, allocations } = analysis;
  const { bucket_analysis: buckets } = summary;

  const kpiItems = [
    {
      id: "income",
      label: "Monthly income",
      value: money(summary.total_income_inr),
    },
    {
      id: "expenses",
      label: "Monthly expenses",
      value: money(summary.total_expenses_inr),
    },
    {
      id: "net",
      label: "Net cash flow",
      value: money(summary.net_cash_flow_inr),
      tone:
        summary.net_cash_flow_inr < 0
          ? ("danger" as const)
          : summary.net_cash_flow_inr > 0
            ? ("positive" as const)
            : ("default" as const),
    },
    {
      id: "savings-rate",
      label: "Savings rate",
      value: `${summary.savings_rate_pct.toFixed(1)}%`,
      tone: summary.savings_rate_pct >= 20 ? ("positive" as const) : ("warning" as const),
    },
    {
      id: "emergency",
      label: "Emergency runway",
      value: `${summary.emergency_fund_months.toFixed(1)} mo`,
      tone: summary.emergency_fund_months >= 3 ? ("positive" as const) : ("warning" as const),
    },
    {
      id: "portfolio",
      label: "Portfolio value",
      value: money(summary.investment_portfolio_inr),
    },
  ];

  const expenseChartItems = form.expense_lines
    .filter((line) => Number(line.amount_inr) > 0)
    .map((line, index) => ({
      id: line.id,
      label: line.name.slice(0, 12) || "Expense",
      value_inr: Number(line.amount_inr),
      color: EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length]!,
    }));

  const bucketChartItems = [
    {
      id: "needs",
      label: "Needs",
      value_inr: buckets.needs_inr,
      color: "#0d9488",
    },
    {
      id: "wants",
      label: "Wants",
      value_inr: buckets.wants_inr,
      color: "#2563eb",
    },
    {
      id: "savings-bucket",
      label: "Savings",
      value_inr: buckets.savings_bucket_inr,
      color: "#7c3aed",
    },
  ];

  return (
    <>
      <KpiStrip items={kpiItems} ariaLabel="Budget key metrics" />

      {warningMessages.length > 0 && (
        <AlertCallout title="Budget warnings" messages={warningMessages} tone="warning" />
      )}

      <section className="card">
        <div className="schedule-head">
          <h2>Personal budget</h2>
          <div className="actions inline-actions">
            <button type="button" className="btn secondary btn-sm" onClick={loadReferenceBudget}>
              Load reference budget
            </button>
            <label className="btn secondary btn-sm">
              Import JSON
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importBudgetJson(file);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              className="btn secondary btn-sm"
              onClick={exportBudgetSummaryCsv}
            >
              Export CSV
            </button>
            <button type="button" className="btn secondary btn-sm" onClick={exportBudgetJson}>
              Export JSON
            </button>
          </div>
        </div>
        {importError ? <p className="error">{importError}</p> : null}
        <p className="hint">
          Plan monthly income and expenses, track investment holdings, and compare your split to
          the <strong>50/30/20</strong> guideline. Cross-link with{" "}
          <strong>Loan</strong> (EMI), <strong>Multi-debt</strong>, and <strong>Retirement</strong>{" "}
          tabs for deeper payoff and corpus projections.
        </p>
        <div className="form-grid">
          <label>
            Budget month
            <input
              type="text"
              value={form.month_label}
              onChange={(event) => setMonthLabel(event.target.value)}
              placeholder="2026-07"
            />
          </label>
          <label>
            Emergency fund ({currencyLabel})
            <input
              inputMode="decimal"
              value={form.emergency_fund_inr}
              onChange={(event) => setEmergencyFund(event.target.value)}
            />
          </label>
          <label>
            Projection horizon (months)
            <input
              inputMode="numeric"
              value={form.projection_months}
              onChange={(event) => setProjectionMonths(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Income sources</h2>
        <TableWrap label="Income category rows" className="comparison debt-input-table">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Amount ({currencyLabel})</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {form.income_lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <input
                      aria-label={`Income name for ${line.id}`}
                      value={line.name}
                      onChange={(event) => setIncomeField(line.id, "name", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`Income amount for ${line.id}`}
                      value={line.amount_inr}
                      onChange={(event) =>
                        setIncomeField(line.id, "amount_inr", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary"
                      aria-label={`Remove income ${line.name || line.id}`}
                      onClick={() => removeIncomeLine(line.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={addIncomeLine}>
            Add income
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Expense categories</h2>
        <TableWrap label="Expense category rows" className="comparison debt-input-table">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount ({currencyLabel})</th>
                <th>50/30/20 bucket</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {form.expense_lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <input
                      aria-label={`Expense name for ${line.id}`}
                      value={line.name}
                      onChange={(event) => setExpenseField(line.id, "name", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`Expense amount for ${line.id}`}
                      value={line.amount_inr}
                      onChange={(event) =>
                        setExpenseField(line.id, "amount_inr", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <select
                      aria-label={`Bucket for ${line.id}`}
                      value={line.bucket ?? "need"}
                      onChange={(event) =>
                        setExpenseField(line.id, "bucket", event.target.value as BudgetBucket)
                      }
                    >
                      {(["need", "want", "savings"] as const).map((bucket) => (
                        <option key={bucket} value={bucket}>
                          {BUCKET_LABELS[bucket]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary"
                      aria-label={`Remove expense ${line.name || line.id}`}
                      onClick={() => removeExpenseLine(line.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={addExpenseLine}>
            Add expense
          </button>
        </div>
      </section>

      <section className="card">
        <h2>50/30/20 comparison</h2>
        <TableWrap label="50/30/20 bucket comparison" className="comparison">
          <table>
            <thead>
              <tr>
                <th>Bucket</th>
                <th>Amount</th>
                <th>Actual % of income</th>
                <th>Target %</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  kind: "need" as const,
                  label: "Needs",
                  amount: buckets.needs_inr,
                  actual: buckets.needs_pct,
                  target: buckets.target_needs_pct,
                },
                {
                  kind: "want" as const,
                  label: "Wants",
                  amount: buckets.wants_inr,
                  actual: buckets.wants_pct,
                  target: buckets.target_wants_pct,
                },
                {
                  kind: "savings" as const,
                  label: "Savings (budgeted)",
                  amount: buckets.savings_bucket_inr,
                  actual: buckets.savings_bucket_pct,
                  target: buckets.target_savings_pct,
                },
              ].map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{money(row.amount)}</td>
                  <td>{row.actual.toFixed(1)}%</td>
                  <td>{row.target}%</td>
                  <td className={bucketDeltaClass(row.kind, row.actual, row.target)}>
                    {(row.actual - row.target).toFixed(1)} pp
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <div className="chart-grid">
          <BarChart
            title="Expense buckets (50/30/20)"
            items={bucketChartItems}
            yLabel={currencyLabel}
            locale={locale}
          />
          {expenseChartItems.length > 0 && (
            <BarChart
              title="Expenses by category"
              items={expenseChartItems}
              yLabel={currencyLabel}
              locale={locale}
            />
          )}
        </div>
      </section>

      <section className="card">
        <h2>Investment holdings</h2>
        <p className="hint">
          Manual portfolio tracker — current value, monthly contributions, and expected return for
          projection. Not live market data.
        </p>
        <TableWrap label="Investment holdings" className="comparison debt-input-table">
          <table>
            <thead>
              <tr>
                <th>Holding</th>
                <th>Asset class</th>
                <th>Current value ({currencyLabel})</th>
                <th>Monthly contribution</th>
                <th>Expected return (%)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {form.investments.map((holding) => (
                <tr key={holding.id}>
                  <td>
                    <input
                      aria-label={`Holding name for ${holding.id}`}
                      value={holding.name}
                      onChange={(event) =>
                        setInvestmentField(holding.id, "name", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <select
                      aria-label={`Asset class for ${holding.id}`}
                      value={holding.asset_class}
                      onChange={(event) =>
                        setInvestmentField(
                          holding.id,
                          "asset_class",
                          event.target.value as InvestmentAssetClass,
                        )
                      }
                    >
                      {(
                        ["equity", "debt", "gold", "cash", "other"] as InvestmentAssetClass[]
                      ).map((assetClass) => (
                        <option key={assetClass} value={assetClass}>
                          {ASSET_CLASS_LABELS[assetClass]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`Current value for ${holding.id}`}
                      value={holding.current_value_inr}
                      onChange={(event) =>
                        setInvestmentField(holding.id, "current_value_inr", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`Monthly contribution for ${holding.id}`}
                      value={holding.monthly_contribution_inr}
                      onChange={(event) =>
                        setInvestmentField(
                          holding.id,
                          "monthly_contribution_inr",
                          event.target.value,
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`Expected return for ${holding.id}`}
                      value={holding.expected_return_pct}
                      onChange={(event) =>
                        setInvestmentField(holding.id, "expected_return_pct", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary"
                      aria-label={`Remove holding ${holding.name || holding.id}`}
                      onClick={() => removeInvestment(holding.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={addInvestment}>
            Add holding
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Portfolio summary</h2>
        <TableWrap label="Portfolio allocation by asset class">
          <table>
            <thead>
              <tr>
                <th>Asset class</th>
                <th>Value</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={3}>No holdings entered.</td>
                </tr>
              ) : (
                allocations.map((row) => (
                  <tr key={row.asset_class}>
                    <td>{ASSET_CLASS_LABELS[row.asset_class]}</td>
                    <td>{money(row.value_inr)}</td>
                    <td>{row.share_pct.toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrap>
        <p className="hint">
          Projected portfolio in {form.projection_months || 12} months:{" "}
          <strong>{money(investment_projection.projected_total_inr)}</strong> (contributions{" "}
          {money(investment_projection.total_contributions_inr)}, growth{" "}
          {money(investment_projection.total_growth_inr)}).
        </p>
        {investment_projection.rows.length > 1 && (
          <LineChart
            title="Portfolio projection"
            points={buildBudgetPortfolioCurve(investment_projection.rows)}
            stroke="#2563eb"
            yLabel="Portfolio"
            locale={locale}
          />
        )}
      </section>
    </>
  );
}
