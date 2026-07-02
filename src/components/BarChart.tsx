import { formatMoney } from "../lib/locale/formatMoney";
import type { Locale } from "../lib/locale/types";

export interface BarChartItem {
  id: string;
  label: string;
  value_inr: number;
  color: string;
}

interface BarChartProps {
  title: string;
  items: BarChartItem[];
  yLabel: string;
  locale?: Locale;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 48, left: 56 };

export function BarChart({
  title,
  items,
  yLabel,
  locale = "IN",
}: BarChartProps) {
  const money = (value: number) => formatMoney(value, locale);

  if (items.length === 0) {
    return (
      <div className="schedule-chart">
        <h3>{title}</h3>
        <p className="hint">No data to chart.</p>
      </div>
    );
  }

  const maxY = Math.max(...items.map((item) => item.value_inr), 1);
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const barGap = 16;
  const barWidth = (innerW - barGap * (items.length - 1)) / items.length;

  return (
    <div className="schedule-chart">
      <h3>{title}</h3>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${title}: ${items.map((item) => `${item.label} ${money(item.value_inr)}`).join(", ")}`}
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
        <text x={4} y={PAD.top + 10} fontSize="10" className="chart-label">
          {yLabel}
        </text>
        {items.map((item, index) => {
          const barHeight = (item.value_inr / maxY) * innerH;
          const x = PAD.left + index * (barWidth + barGap);
          const y = PAD.top + innerH - barHeight;
          return (
            <g key={item.id}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color}
                rx={4}
              />
              <text
                x={x + barWidth / 2}
                y={HEIGHT - PAD.bottom + 14}
                fontSize="9"
                textAnchor="middle"
                className="chart-label"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
