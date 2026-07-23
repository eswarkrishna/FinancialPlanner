import type { RetirementDrawdownYearRow } from "../retirement";
import { escapeCsvCell } from "./csvEscape";

/** Serialize retirement post-retirement drawdown timeline to CSV (SPEC §4.11.2). */
export function retirementDrawdownToCsv(rows: RetirementDrawdownYearRow[]): string {
  const headers = [
    "year",
    "opening_inr",
    "growth_inr",
    "withdrawals_inr",
    "closing_inr",
  ];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const cells = [
      row.year,
      row.opening_inr,
      row.growth_inr,
      row.withdrawals_inr,
      row.closing_inr,
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  });
  return lines.join("\n");
}
