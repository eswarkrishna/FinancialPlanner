import { roundGbp } from "../money";

export interface GiaDrawResult {
  net_gbp: number;
  tax_gbp: number;
  gain_realised_gbp: number;
  new_balance_gbp: number;
  new_cost_basis_gbp: number;
  remaining_exempt_gbp: number;
}

/**
 * SPEC-UK §7.5 — pro-rata GIA liquidation with CGT.
 * `drawGbp` is gross withdrawal from GIA balance `V` with cost basis `C`.
 */
export function giaNetDraw(
  drawGbp: number,
  balanceGbp: number,
  costBasisGbp: number,
  cgtRatePct: number,
  remainingExemptGbp: number,
): GiaDrawResult {
  if (drawGbp <= 0 || balanceGbp <= 0) {
    return {
      net_gbp: 0,
      tax_gbp: 0,
      gain_realised_gbp: 0,
      new_balance_gbp: balanceGbp,
      new_cost_basis_gbp: costBasisGbp,
      remaining_exempt_gbp: remainingExemptGbp,
    };
  }
  const d = Math.min(drawGbp, balanceGbp);
  const unrealisedGain = Math.max(0, balanceGbp - costBasisGbp);
  const gainRealised = roundGbp((d * unrealisedGain) / balanceGbp);
  const taxableGain = Math.max(0, gainRealised - remainingExemptGbp);
  const exemptUsed = Math.min(remainingExemptGbp, gainRealised);
  const tax = roundGbp((taxableGain * cgtRatePct) / 100);
  const net = roundGbp(d - tax);
  const basisRatio = d / balanceGbp;
  return {
    net_gbp: net,
    tax_gbp: tax,
    gain_realised_gbp: gainRealised,
    new_balance_gbp: roundGbp(balanceGbp - d),
    new_cost_basis_gbp: roundGbp(costBasisGbp * (1 - basisRatio)),
    remaining_exempt_gbp: roundGbp(remainingExemptGbp - exemptUsed),
  };
}
