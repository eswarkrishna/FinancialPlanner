import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ScheduleRow } from "../loan";
import type { ScheduleCsvOptions } from "./scheduleCsv";

function monthLabel(monthIndex: number, startDateIso?: string): string {
  if (!startDateIso) return String(monthIndex);
  const start = new Date(startDateIso);
  if (Number.isNaN(start.getTime())) return String(monthIndex);
  const d = new Date(start);
  d.setMonth(d.getMonth() + monthIndex - 1);
  return d.toISOString().slice(0, 10);
}

/** Build amortisation schedule PDF bytes (SPEC §4.9). */
export function scheduleToPdfBytes(
  rows: ScheduleRow[],
  options: ScheduleCsvOptions & { title?: string } = {},
): Uint8Array {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const title = options.title ?? "Loan amortisation schedule";
  doc.setFontSize(12);
  doc.text(title, 40, 32);

  const head = [
    "Month",
    ...(options.startDateIso ? ["Date"] : []),
    "Opening",
    "Interest",
    "Principal",
    "Prepay",
    "Closing",
    "Payment",
    "EMI",
    ...(options.includeCashBalance ? ["Cash"] : []),
  ];

  const body = rows.map((row, index) => {
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
      cells.push(options.cashBalances?.[index] ?? "");
    }
    return cells;
  });

  autoTable(doc, {
    startY: 44,
    head: [head],
    body,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [13, 148, 136] },
  });

  return doc.output("arraybuffer") as Uint8Array;
}
