/** Parse YYYY-MM-DD as a local calendar date (avoids UTC shift from Date.parse). */
export function parseIsoDateLocal(dateIso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Add months to a YYYY-MM-DD date; returns local ISO date string. */
export function addMonthsToIsoDate(dateIso: string, months: number): string | null {
  const dt = parseIsoDateLocal(dateIso);
  if (!dt) return null;
  dt.setMonth(dt.getMonth() + months);
  return formatIsoDateLocal(dt);
}
