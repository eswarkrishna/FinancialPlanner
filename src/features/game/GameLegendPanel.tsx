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

export function GameLegendPanel() {
  return (
    <section className="card game-legend" aria-labelledby="game-legend-heading">
      <details className="game-legend-details" open>
        <summary id="game-legend-heading" className="game-legend-summary">
          Legend — what the abbreviations mean
        </summary>
        <p className="hint game-legend-intro">
          Tables and recommendations use short internal codes (e.g.{" "}
          <code>B_PREPAY_25</code>). Below is the plain-English meaning. Payoff
          amounts are in INR.
        </p>
        <div className="game-legend-grid">
          {VISIBLE_CATEGORIES.map((category) => (
            <div key={category} className="game-legend-group">
              <h3 className="game-legend-group-title">
                {LEGEND_CATEGORY_TITLES[category]}
              </h3>
              <dl className="game-legend-list">
                {LEGEND_BY_CATEGORY[category].map((entry) => (
                  <div key={entry.code} className="game-legend-item">
                    <dt>
                      <code className="game-legend-code">{entry.code}</code>
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
