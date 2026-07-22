import type { SipYearRow } from "../sip";
import { escapeCsvCell } from "./csvEscape";

/** Serialize SIP yearly timeline to CSV (SPEC §4.18). */
export function sipTimelineToCsv(rows: SipYearRow[]): string {
  const headers = ["year", "opening_inr", "contribution_inr", "gains_inr", "closing_inr"];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const cells = [
      row.year,
      row.opening_inr,
      row.contribution_inr,
      row.gains_inr,
      row.closing_inr,
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  });
  return lines.join("\n");
}
