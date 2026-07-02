import type { ChartPoint } from "../lib/loan/chartData";
import { formatMoney } from "../lib/locale/formatMoney";
import type { Locale } from "../lib/locale/types";

interface LineChartProps {
  title: string;
  points: ChartPoint[];
  stroke: string;
  yLabel: string;
  xLabel?: string;
  locale?: Locale;
}

const WIDTH = 640;
const HEIGHT = 200;
const PAD = { top: 12, right: 12, bottom: 28, left: 56 };

function buildPath(points: ChartPoint[], maxY: number, maxX: number): string {
  if (points.length === 0) return "";
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  return points
    .map((p, i) => {
      const x = PAD.left + (p.month / maxX) * innerW;
      const y = PAD.top + innerH - (p.value_inr / maxY) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function LineChart({
  title,
  points,
  stroke,
  yLabel,
  xLabel = "Month",
  locale = "IN",
}: LineChartProps) {
  const money = (value: number) => formatMoney(value, locale);

  if (points.length === 0) {
    return (
      <div className="schedule-chart">
        <h3>{title}</h3>
        <p className="hint">No data to chart.</p>
      </div>
    );
  }

  const maxY = Math.max(...points.map((p) => p.value_inr), 1);
  const maxX = Math.max(...points.map((p) => p.month), 1);
  const path = buildPath(points, maxY, maxX);
  const last = points[points.length - 1]!;

  return (
    <div className="schedule-chart">
      <h3>{title}</h3>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${title}: ends at ${money(last.value_inr)} at ${xLabel.toLowerCase()} ${last.month}`}
        className="schedule-chart-svg"
      >
        <line
          x1={PAD.left}
          y1={HEIGHT - PAD.bottom}
          x2={WIDTH - PAD.right}
          y2={HEIGHT - PAD.bottom}
          className="chart-axis"
        />
        <line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={HEIGHT - PAD.bottom}
          className="chart-axis"
        />
        <text x={PAD.left} y={HEIGHT - 6} fontSize="10" className="chart-label">
          {xLabel} 1
        </text>
        <text x={WIDTH - PAD.right - 40} y={HEIGHT - 6} fontSize="10" className="chart-label">
          {maxX}
        </text>
        <text x={4} y={PAD.top + 10} fontSize="10" className="chart-label">
          {yLabel}
        </text>
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
      <p className="hint chart-end-label">
        {xLabel} {last.month}: {money(last.value_inr)}
      </p>
    </div>
  );
}
