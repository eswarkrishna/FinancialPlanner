import { formatMoney } from "../../../lib/locale/formatMoney";
import type { Locale } from "../../../lib/locale/types";
import type {
  PrepayStrategyCompareRow,
  ScenarioView,
} from "../hooks/loanModelTypes";

interface PrepayStrategyCompareProps {
  locale: Locale;
  rows: PrepayStrategyCompareRow[];
  selectedView: ScenarioView;
  emiLabel: string;
  onSelect: (view: "PREPAY_EMI" | "PREPAY_TENURE") => void;
}

export function PrepayStrategyCompare({
  locale,
  rows,
  selectedView,
  emiLabel,
  onSelect,
}: PrepayStrategyCompareProps) {
  const money = (value: number) => formatMoney(value, locale);

  return (
    <section className="card" aria-labelledby="prepay-strategy-compare-heading">
      <h2 id="prepay-strategy-compare-heading">Reduce EMI vs Reduce Tenure</h2>
      <p className="hint">
        Side-by-side comparison of the two prepayment policies for your one-time
        prepay. Select a strategy to update the amortisation schedule.
      </p>
      <div className="strategy-compare-grid" role="group" aria-label="Prepayment strategy comparison">
        {rows.map((row) => {
          const selected = selectedView === row.id;
          return (
            <button
              key={row.id}
              type="button"
              className={`strategy-compare-card${selected ? " is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect(row.id)}
            >
              <span className="strategy-compare-card__title">{row.policyLabel}</span>
              <dl className="strategy-compare-card__metrics">
                <div>
                  <dt>New {emiLabel}</dt>
                  <dd>{money(row.newEmi)}</dd>
                </div>
                <div>
                  <dt>New tenure</dt>
                  <dd>{row.newTenureMonths} mo</dd>
                </div>
                <div>
                  <dt>Total interest</dt>
                  <dd>{money(row.totalInterest)}</dd>
                </div>
                <div>
                  <dt>Gross interest saved</dt>
                  <dd>{money(row.grossInterestSaved)}</dd>
                </div>
                <div>
                  <dt>Prepayment fees</dt>
                  <dd>{money(row.prepaymentFees)}</dd>
                </div>
                <div>
                  <dt>Net savings after fee</dt>
                  <dd>{money(row.netSavingsAfterFee)}</dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
    </section>
  );
}
