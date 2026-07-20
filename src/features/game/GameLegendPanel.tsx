import {
  LEGEND_BY_CATEGORY,
  LEGEND_CATEGORY_TITLES,
  type LegendCategory,
} from "./gameLegend";

const VISIBLE_CATEGORIES: LegendCategory[] = [
  "players",
  "profiles",
  "borrower",
  "lender",
  "household",
  "nature",
  "columns",
  "warnings",
];

import type { Locale } from "../../lib/locale/types";

export function GameLegendPanel({ locale }: { locale: Locale }) {
  const currencyLabel = locale === "US" ? "USD" : "INR";
  return (
    <section className="card game-legend" aria-labelledby="game-legend-heading">
      <details className="game-legend-details" open>
        <summary id="game-legend-heading" className="game-legend-summary">
          Legend — what the abbreviations mean
        </summary>
        <p className="hint game-legend-intro">
          Short labels in the tables map to plain-English meanings below. Payoff
          amounts are in {currencyLabel}.
        </p>
        <div className="game-legend-grid">
          {VISIBLE_CATEGORIES.map((category) => (
            <div key={category} className="game-legend-group">
              <p className="game-legend-group-title">
                {LEGEND_CATEGORY_TITLES[category]}
              </p>
              <dl className="game-legend-list">
                {LEGEND_BY_CATEGORY[category].map((entry) => (
                  <div key={entry.code} className="game-legend-item">
                    <dt>
                      <span className="game-legend-label">{entry.label}</span>
                    </dt>
                    <dd>{entry.meaning}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
