/** SPEC-US v1.1 — employer match vesting schedules. */

export type VestingSchedule = "immediate" | "cliff_3" | "graded_6";

/**
 * Vested fraction (0–100) of employer-contributed balance for modelling.
 * Employee deferrals are always 100% vested.
 */
export function computeVestedFractionPct(
  schedule: VestingSchedule,
  yearsOfService: number,
): number {
  const years = Math.max(0, yearsOfService);
  switch (schedule) {
    case "immediate":
      return 100;
    case "cliff_3":
      return years >= 3 ? 100 : 0;
    case "graded_6": {
      if (years >= 6) return 100;
      if (years <= 0) return 0;
      // 20% per year through year 6 (IRS-style graded).
      return Math.min(100, Math.round((years / 6) * 100));
    }
    default:
      return 100;
  }
}

/** Max 401(k) loan amount: min(50% vested balance, $50,000). */
export function computeK401LoanCapUsd(vestedBalanceUsd: number): number {
  const vested = Math.max(0, vestedBalanceUsd);
  return Math.min(vested * 0.5, 50_000);
}
