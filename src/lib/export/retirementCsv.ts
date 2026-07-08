import type { RetirementYearRow } from "../retirement";

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Serialize retirement yearly corpus timeline to CSV (SPEC §4.11). */
export function retirementTimelineToCsv(rows: RetirementYearRow[]): string {
  const headers = ["year", "corpus_nominal_inr", "corpus_real_inr"];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const cells = [row.year, row.corpus_nominal_inr, row.corpus_real_inr];
    lines.push(cells.map(escapeCsvCell).join(","));
  });
  return lines.join("\n");
}
