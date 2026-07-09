export interface KpiItem {
  id: string;
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning" | "danger";
}

interface KpiStripProps {
  items: KpiItem[];
  ariaLabel?: string;
}

export function KpiStrip({ items, ariaLabel = "Key metrics" }: KpiStripProps) {
  if (items.length === 0) return null;

  return (
    <dl className="kpi-strip" aria-label={ariaLabel}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`kpi-card${item.tone ? ` kpi-card--${item.tone}` : ""}`}
        >
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
