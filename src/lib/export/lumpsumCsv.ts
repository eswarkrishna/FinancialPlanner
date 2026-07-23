import type { LumpsumYearRow } from "../lumpsum";
import { escapeCsvCell } from "./csvEscape";

/** Serialize lumpsum yearly timeline to CSV (SPEC §4.21). */
export function lumpsumTimelineToCsv(rows: LumpsumYearRow[]): string {
  const headers = ["year", "opening_inr", "interest_inr", "closing_inr"];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const cells = [row.year, row.opening_inr, row.interest_inr, row.closing_inr];
    lines.push(cells.map(escapeCsvCell).join(","));
  });
  return lines.join("\n");
}
