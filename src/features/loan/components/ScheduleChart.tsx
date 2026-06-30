import type { ChartPoint } from "../../../lib/loan/chartData";
import { formatInr } from "../../../lib/formatInr";

interface ScheduleChartProps {
  title: string;
  points: ChartPoint[];
  stroke: string;
  yLabel: string;
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

export function ScheduleChart({ title, points, stroke, yLabel }: ScheduleChartProps) {
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
        aria-label={`${title}: ends at ${formatInr(last.value_inr)} by month ${last.month}`}
        className="schedule-chart-svg"
      >
        <line
          x1={PAD.left}
          y1={HEIGHT - PAD.bottom}
          x2={WIDTH - PAD.right}
          y2={HEIGHT - PAD.bottom}
          stroke="#cbd5e1"
        />
        <line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={HEIGHT - PAD.bottom}
          stroke="#cbd5e1"
        />
        <text x={PAD.left} y={HEIGHT - 6} fontSize="10" fill="#64748b">
          Month 1
        </text>
        <text x={WIDTH - PAD.right - 40} y={HEIGHT - 6} fontSize="10" fill="#64748b">
          {maxX}
        </text>
        <text x={4} y={PAD.top + 10} fontSize="10" fill="#64748b">
          {yLabel}
        </text>
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
      <p className="hint chart-end-label">
        Month {last.month}: {formatInr(last.value_inr)}
      </p>
    </div>
  );
}
