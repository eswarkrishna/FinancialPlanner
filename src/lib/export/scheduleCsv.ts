import type { ScheduleRow } from "../loan";

export interface ScheduleCsvOptions {
  includeCashBalance?: boolean;
  cashBalances?: number[];
  startDateIso?: string;
}

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

/** Serialize amortisation rows to CSV (SPEC §4.9). */
export function scheduleToCsv(
  rows: ScheduleRow[],
  options: ScheduleCsvOptions = {},
): string {
  const headers = [
    "month",
    ...(options.startDateIso ? ["calendar_date"] : []),
    "opening_inr",
    "interest_inr",
    "principal_inr",
    "prepayment_inr",
    "closing_inr",
    "payment_inr",
    "emi_inr",
  ];
  if (options.includeCashBalance) {
    headers.push("cash_balance_inr");
  }

  const lines = [headers.join(",")];
  rows.forEach((row, i) => {
    const cells: (string | number)[] = [
      row.month,
      ...(options.startDateIso ? [monthLabel(row.month, options.startDateIso)] : []),
      row.opening_inr,
      row.interest_inr,
      row.principal_inr,
      row.prepayment_inr,
      row.closing_inr,
      row.payment_inr,
      row.emi_inr,
    ];
    if (options.includeCashBalance) {
      cells.push(options.cashBalances?.[i] ?? "");
    }
    lines.push(cells.map(escapeCsvCell).join(","));
  });
  return lines.join("\n");
}
