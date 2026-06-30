import { roundInr } from "../money";

/** Effective gold liquidation value after optional haircut (SPEC §4.2, §9). */
export function effectiveGoldLiquidInr(
  goldLiquidInr: number,
  haircutEnabled: boolean,
  haircutPct: number,
): number {
  const safe = Math.max(0, goldLiquidInr);
  if (!haircutEnabled || haircutPct <= 0) return safe;
  const pct = Math.min(100, Math.max(0, haircutPct));
  return roundInr(safe * (1 - pct / 100));
}
