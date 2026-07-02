import type { DebtMonthRow } from "../debt";

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function monthLabel(monthIndex: number, startDateIso?: string): string {
  if (!startDateIso) return String(monthIndex);
  const start = new Date(startDateIso);
  if (Number.isNaN(start.getTime())) return String(monthIndex);
  const d = new Date(start);
  d.setMonth(d.getMonth() + monthIndex - 1);
  return d.toISOString().slice(0, 10);
}

/** Serialize debt payoff timeline rows to CSV (SPEC §4.10). */
export function debtTimelineToCsv(
  rows: DebtMonthRow[],
  options: { startDateIso?: string } = {},
): string {
  const headers = [
    "month",
    ...(options.startDateIso ? ["calendar_date"] : []),
    "opening_total_inr",
    "interest_inr",
    "payment_inr",
    "closing_total_inr",
    "focus_debt",
  ];

  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const cells: (string | number)[] = [
      row.month,
      ...(options.startDateIso ? [monthLabel(row.month, options.startDateIso)] : []),
      row.opening_total_inr,
      row.interest_inr,
      row.payment_inr,
      row.closing_total_inr,
      row.focus_debt_name ?? "",
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  });
  return lines.join("\n");
}
