/** SPEC §7.3 / SPEC-US §4.7 — tranche1 at U, tranche2 at U + 11 (1-based). */
export function trancheMonthsFromStart(startMonth: number): {
  tranche1Month: number;
  tranche2Month: number;
} {
  const u = Math.max(1, startMonth);
  return { tranche1Month: u, tranche2Month: u + 11 };
}
