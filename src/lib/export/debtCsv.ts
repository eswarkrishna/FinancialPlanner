import type { DebtMonthRow } from "../debt";
import { addMonthsToIsoDate } from "../shared/dateIso";
import { escapeCsvCell } from "./csvEscape";

function debtMonthCalendarDate(monthIndex: number, startDateIso: string): string {
  return addMonthsToIsoDate(startDateIso, monthIndex) ?? String(monthIndex);
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
      ...(options.startDateIso
        ? [debtMonthCalendarDate(row.month, options.startDateIso)]
        : []),
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
