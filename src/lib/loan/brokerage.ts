import { roundUsd } from "../money";

/** Effective brokerage liquidation after optional haircut (SPEC-US §4.2). */
export function effectiveBrokerageLiquidUsd(
  brokerageLiquidUsd: number,
  haircutEnabled: boolean,
  haircutPct: number,
): number {
  const base = Math.max(0, brokerageLiquidUsd);
  if (!haircutEnabled) return roundUsd(base);
  const pct = Math.min(100, Math.max(0, haircutPct));
  return roundUsd(base * (1 - pct / 100));
}
