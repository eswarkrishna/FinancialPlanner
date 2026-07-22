import type { SsyYearRow } from "../ssy";
import { escapeCsvCell } from "./csvEscape";

/** Serialize SSY yearly timeline to CSV (SPEC §4.19). */
export function ssyTimelineToCsv(rows: SsyYearRow[]): string {
  const headers = [
    "year",
    "girl_age",
    "opening_inr",
    "contribution_inr",
    "interest_inr",
    "closing_inr",
  ];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const cells = [
      row.year,
      row.girl_age,
      row.opening_inr,
      row.contribution_inr,
      row.interest_inr,
      row.closing_inr,
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  });
  return lines.join("\n");
}
