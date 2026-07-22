import type { PpfYearRow } from "../ppf";
import { escapeCsvCell } from "./csvEscape";

/** Serialize PPF yearly timeline to CSV (SPEC §4.17). */
export function ppfTimelineToCsv(rows: PpfYearRow[]): string {
  const headers = [
    "year",
    "opening_inr",
    "contribution_inr",
    "interest_inr",
    "closing_inr",
  ];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const cells = [
      row.year,
      row.opening_inr,
      row.contribution_inr,
      row.interest_inr,
      row.closing_inr,
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  });
  return lines.join("\n");
}
