import { formatMoney } from "../../../lib/locale/formatMoney";
import type { Locale } from "../../../lib/locale/types";
import type { PayoffCell } from "../../../lib/game/types";
import { formatProfileReadable } from "../gameLegend";

interface PayoffHeatmapProps {
  cells: PayoffCell[];
  locale: Locale;
}

function heatTone(value: number, min: number, max: number): string {
  if (max === min) return "mid";
  const ratio = (value - min) / (max - min);
  if (ratio >= 0.66) return "high";
  if (ratio >= 0.33) return "mid";
  return "low";
}

export function PayoffHeatmap({ cells, locale }: PayoffHeatmapProps) {
  const money = (value: number) => formatMoney(value, locale);
  const borrowerValues = cells.map((cell) => cell.payoffs.B ?? 0);
  const min = Math.min(...borrowerValues);
  const max = Math.max(...borrowerValues);

  return (
    <div className="payoff-heatmap" aria-label="Payoff matrix heatmap">
      {cells.map((cell) => {
        const borrower = cell.payoffs.B ?? 0;
        const other =
          cell.payoffs.L !== undefined
            ? cell.payoffs.L
            : cell.payoffs.H !== undefined
              ? cell.payoffs.H
              : undefined;
        const tone = heatTone(borrower, min, max);
        return (
          <div
            key={cell.cell_key}
            className={`payoff-heatmap-cell payoff-heatmap-cell--${tone}`}
            title={`B: ${money(borrower)}${other !== undefined ? ` · Other: ${money(other)}` : ""}`}
          >
            <span className="payoff-heatmap-action">
              {formatProfileReadable(cell.action_profile)}
            </span>
            <span className="payoff-heatmap-value">{money(borrower)}</span>
            {other !== undefined ? (
              <span className="payoff-heatmap-other">Other: {money(other)}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
