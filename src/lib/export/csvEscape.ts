/** Neutralize spreadsheet formula injection (leading = + - @ tab). */
const CSV_FORMULA_PREFIX = /^[=+\-@\t]/;

export function neutralizeCsvFormula(value: string): string {
  if (CSV_FORMULA_PREFIX.test(value)) {
    return `'${value}`;
  }
  return value;
}

/** Escape a CSV cell and neutralize formula prefixes. */
export function escapeCsvCell(value: string | number): string {
  const neutralized = neutralizeCsvFormula(String(value));
  if (/[",\n\r]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}
