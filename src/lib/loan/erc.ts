import { roundGbp } from "../money";

/** Rolling 12-month block index (1-based month → block 0, 1, …). SPEC-UK §7.4 */
export function ercBlockIndex(month: number): number {
  return Math.floor((month - 1) / 12);
}

export interface ErcConfig {
  overpayment_allowance_pct: number;
  erc_pct: number;
}

export interface ErcFeeResult {
  fee_gbp: number;
  incremental_excess_gbp: number;
  warning?: "ERC_ALLOWANCE_EXCEEDED";
}

/**
 * Tracks fee-free allowance per rolling block. SPEC-UK §4.1 / §7.4.
 * Fee charged only on the increment above allowance in the month excess arises.
 */
export class ErcBlockTracker {
  private overpaidInBlock = 0;
  private blockStartOpening: number;
  private currentBlock = -1;

  constructor(
    private readonly config: ErcConfig,
    initialOpeningBalance: number,
  ) {
    this.blockStartOpening = initialOpeningBalance;
  }

  /** Call at start of each month with that month's opening loan balance. */
  beginMonth(month: number, openingBalance: number): void {
    const block = ercBlockIndex(month);
    if (block !== this.currentBlock) {
      this.currentBlock = block;
      this.overpaidInBlock = 0;
      this.blockStartOpening = openingBalance;
    }
  }

  allowanceGbp(): number {
    return roundGbp(
      (this.blockStartOpening * this.config.overpayment_allowance_pct) / 100,
    );
  }

  /** Record prepayment (lump + recurring extra) and return ERC fee for this event. */
  recordPrepayment(prepayGbp: number): ErcFeeResult {
    if (prepayGbp <= 0) {
      return { fee_gbp: 0, incremental_excess_gbp: 0 };
    }
    const allowance = this.allowanceGbp();
    const prevExcess = Math.max(0, this.overpaidInBlock - allowance);
    this.overpaidInBlock = roundGbp(this.overpaidInBlock + prepayGbp);
    const newExcess = Math.max(0, this.overpaidInBlock - allowance);
    const incrementalExcess = roundGbp(newExcess - prevExcess);
    const fee =
      this.config.erc_pct > 0
        ? roundGbp((incrementalExcess * this.config.erc_pct) / 100)
        : 0;
    const warning =
      this.config.erc_pct === 0 && newExcess > 0
        ? ("ERC_ALLOWANCE_EXCEEDED" as const)
        : undefined;
    return {
      fee_gbp: fee,
      incremental_excess_gbp: incrementalExcess,
      warning,
    };
  }
}
