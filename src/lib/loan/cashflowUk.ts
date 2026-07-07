import { computeEmi, monthlyRateFromAnnualPercent } from "./emi";
import type { ScheduleRow, ScheduleTotals, TimedPrepaymentEvent } from "./amortisation";
import { roundGbp } from "../money";
import {
  BALANCE_EPSILON_INR,
  MAX_CASHFLOW_SIM_MONTHS,
  MAX_CONSECUTIVE_PAYMENT_SHORTFALLS,
} from "../shared/constants";
import { ErcBlockTracker, type ErcConfig } from "./erc";
import { giaNetDraw } from "./giaLiquidation";
import { netRedundancyGbp } from "../pension/autoEnrolment";
import {
  DEFAULT_CGT_ANNUAL_EXEMPT_GBP,
  DEFAULT_CGT_RATE_PCT,
  DEFAULT_JSA_DURATION_MONTHS,
  DEFAULT_SMI_CAPITAL_CAP_GBP,
  DEFAULT_SMI_RATE_PCT,
  DEFAULT_SMI_WAIT_MONTHS,
} from "../uk/constants";

export type UkInflowDestination = "loan_prepay" | "cash_buffer" | "split";

export interface UkCashflowScheduleRow extends ScheduleRow {
  cash_balance_inr: number;
  erc_fee_inr: number;
  smi_credit_inr: number;
  smi_loan_balance_inr: number;
  events: string[];
}

export interface UkCashflowSimInput {
  principal_inr: number;
  annual_interest_rate: number;
  tenure_months: number;
  cash_inr: number;
  isa_balance_inr: number;
  gia_balance_inr: number;
  gia_cost_basis_inr: number;
  /** Projection-only — never decremented. */
  pension_pot_inr: number;
  monthly_income_inr: number;
  monthly_living_expense_inr: number;
  monthly_extra_to_loan_inr: number;
  monthly_salary_extra_inr?: number;
  job_loss_enabled: boolean;
  job_loss_start_month: number;
  redundancy_payment_inr: number;
  marginal_tax_rate_pct: number;
  redundancy_destination?: UkInflowDestination;
  redundancy_loan_fraction?: number;
  /** Bridge: redundancy to cash first; covers living + payment shortfall before prepay. */
  redundancy_bridge_liquidity_first?: boolean;
  monthly_jsa_inr: number;
  jsa_duration_months: number;
  smi_enabled: boolean;
  smi_wait_months: number;
  smi_rate_pct: number;
  smi_capital_cap_inr: number;
  cgt_rate_pct: number;
  cgt_annual_exempt_inr: number;
  erc_config: ErcConfig;
  extra_prepayments?: TimedPrepaymentEvent[];
  /** When true, keep original payment after prepays (recompute_tenure_keep_payment). Default true. */
  keep_original_payment?: boolean;
}

export interface UkCashflowSimResult {
  rows: UkCashflowScheduleRow[];
  totals: ScheduleTotals & { total_erc_fees_inr: number };
  emi_inr: number;
  min_cash_balance_inr: number;
  smi_loan_balance_inr: number;
  net_redundancy_inr: number;
  total_jsa_received_inr: number;
  warnings: string[];
}

const BALANCE_EPS = BALANCE_EPSILON_INR;

function loanFractionFromDestination(
  destination: UkInflowDestination,
  loanFraction?: number,
): number {
  if (destination === "loan_prepay") return 1;
  if (destination === "cash_buffer") return 0;
  return Math.min(1, Math.max(0, loanFraction ?? 0.5));
}

function pushUkRow(
  rows: UkCashflowScheduleRow[],
  m: number,
  opening: number,
  interest: number,
  principal: number,
  prepay: number,
  closing: number,
  emiShown: number,
  cashBalance: number,
  ercFee: number,
  smiCredit: number,
  smiLoanBalance: number,
  events: string[],
) {
  const payment = roundGbp(interest + principal + prepay);
  rows.push({
    month: m,
    opening_inr: opening,
    interest_inr: interest,
    principal_inr: principal,
    prepayment_inr: prepay,
    closing_inr: closing,
    payment_inr: payment,
    emi_inr: emiShown,
    cash_balance_inr: roundGbp(cashBalance),
    erc_fee_inr: ercFee,
    smi_credit_inr: smiCredit,
    smi_loan_balance_inr: roundGbp(smiLoanBalance),
    events: [...events],
  });
}

function drawSavings(
  shortfall: number,
  cash: number,
  isa: number,
  gia: number,
  giaBasis: number,
  cgtRate: number,
  cgtExempt: number,
  events: string[],
): {
  cash: number;
  isa: number;
  gia: number;
  giaBasis: number;
  cgtExempt: number;
  remaining: number;
} {
  let need = shortfall;
  let c = cash;
  let i = isa;
  let g = gia;
  let b = giaBasis;
  let ex = cgtExempt;

  const fromCash = Math.min(c, need);
  if (fromCash > 0) {
    c = roundGbp(c - fromCash);
    need = roundGbp(need - fromCash);
    events.push(`draw:cash:${fromCash}`);
  }
  if (need > 0) {
    const fromIsa = Math.min(i, need);
    if (fromIsa > 0) {
      i = roundGbp(i - fromIsa);
      need = roundGbp(need - fromIsa);
      events.push(`draw:isa:${fromIsa}`);
    }
  }
  if (need > 0 && g > 0) {
    const draw = Math.min(g, need * 1.5);
    const result = giaNetDraw(draw, g, b, cgtRate, ex);
    const applied = Math.min(result.net_gbp, need);
    g = result.new_balance_gbp;
    b = result.new_cost_basis_gbp;
    ex = result.remaining_exempt_gbp;
    need = roundGbp(need - applied);
    if (result.tax_gbp > 0) {
      events.push(`gia:cgt:${result.tax_gbp}`);
    }
    events.push(`draw:gia:net:${applied}`);
  }
  return { cash: c, isa: i, gia: g, giaBasis: b, cgtExempt: ex, remaining: need };
}

/**
 * SPEC-UK §4.8 — UK mortgage cashflow with ERC, redundancy/JSA/SMI, ISA/GIA draws.
 */
export function simulateUkCashflowSchedule(
  input: UkCashflowSimInput,
): UkCashflowSimResult {
  const emi0 = computeEmi(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
  );
  const r = monthlyRateFromAnnualPercent(input.annual_interest_rate);
  const rows: UkCashflowScheduleRow[] = [];
  let balance = roundGbp(input.principal_inr);
  let cashBalance = roundGbp(input.cash_inr);
  let isaBalance = roundGbp(input.isa_balance_inr);
  let giaBalance = roundGbp(input.gia_balance_inr);
  let giaBasis = roundGbp(input.gia_cost_basis_inr || input.gia_balance_inr);
  let cgtExempt = roundGbp(input.cgt_annual_exempt_inr);
  let smiLoanBalance = 0;
  let totalErcFees = 0;
  let totalJsa = 0;
  let totalInterestIfPaidOff = 0;
  let totalInterestWithinTenure = 0;
  let totalPaid = 0;
  let totalPrepay = 0;
  let minCash = cashBalance;
  const warnings: string[] = [];
  const ercTracker = new ErcBlockTracker(input.erc_config, balance);
  const U = input.job_loss_start_month;
  const jsaEnd = U + input.jsa_duration_months - 1;
  const netRedundancy = netRedundancyGbp(
    input.redundancy_payment_inr,
    input.marginal_tax_rate_pct,
  );
  let redundancyApplied = false;
  const prepayMap = new Map<number, number>();
  for (const ev of input.extra_prepayments ?? []) {
    prepayMap.set(ev.month, roundGbp((prepayMap.get(ev.month) ?? 0) + ev.amount_inr));
  }
  const recurringExtra = roundGbp(
    input.monthly_extra_to_loan_inr + (input.monthly_salary_extra_inr ?? 0),
  );
  const cap = Math.min(
    MAX_CASHFLOW_SIM_MONTHS,
    input.tenure_months + 120,
  );
  let consecutiveShortfall = 0;
  let m = 0;

  while (balance > BALANCE_EPS && m < cap) {
    m += 1;
    const opening = balance;
    ercTracker.beginMonth(m, opening);
    const events: string[] = [];
    let smiCredit = 0;
    const inJobLoss = input.job_loss_enabled && m >= U;

    if (inJobLoss) {
      if (m >= U && m <= jsaEnd && input.monthly_jsa_inr > 0) {
        cashBalance = roundGbp(cashBalance + input.monthly_jsa_inr);
        totalJsa = roundGbp(totalJsa + input.monthly_jsa_inr);
        events.push(`jsa:${input.monthly_jsa_inr}`);
      } else if (m === jsaEnd + 1 && input.monthly_jsa_inr > 0) {
        warnings.push("JSA_WINDOW_ENDED");
      }
      if (
        input.smi_enabled &&
        m >= U + input.smi_wait_months
      ) {
        smiCredit = roundGbp(
          (Math.min(opening, input.smi_capital_cap_inr) * input.smi_rate_pct) /
            100 /
            12,
        );
        if (smiCredit > 0) {
          cashBalance = roundGbp(cashBalance + smiCredit);
          smiLoanBalance = roundGbp(smiLoanBalance + smiCredit);
          events.push(`smi:${smiCredit}`);
          if (!warnings.includes("SMI_IS_A_LOAN")) {
            warnings.push("SMI_IS_A_LOAN");
          }
        }
      }
    }

    if (input.monthly_income_inr > 0) {
      cashBalance = roundGbp(cashBalance + input.monthly_income_inr);
    }

    if (
      inJobLoss &&
      !redundancyApplied &&
      m === U &&
      input.redundancy_payment_inr > 0
    ) {
      redundancyApplied = true;
      const dest = input.redundancy_destination ?? "loan_prepay";
      const loanFrac = loanFractionFromDestination(dest, input.redundancy_loan_fraction);
      let toLoan = roundGbp(netRedundancy * loanFrac);
      let toCash = roundGbp(netRedundancy - toLoan);
      if (input.redundancy_bridge_liquidity_first) {
        toCash = netRedundancy;
        toLoan = 0;
      }
      cashBalance = roundGbp(cashBalance + toCash);
      events.push(`redundancy:net:${netRedundancy}`);
      if (toLoan > 0) {
        prepayMap.set(m, roundGbp((prepayMap.get(m) ?? 0) + toLoan));
      }
    }

    if (input.monthly_living_expense_inr > 0) {
      cashBalance = roundGbp(cashBalance - input.monthly_living_expense_inr);
    }

    const interest = roundGbp(opening * r);
    const paymentDue = emi0;
    const isScheduledLast = !input.job_loss_enabled && m === input.tenure_months;
    let principal = isScheduledLast
      ? opening
      : roundGbp(Math.min(opening, Math.max(0, paymentDue - interest)));
    let prepayThisMonth = prepayMap.get(m) ?? 0;
    if (recurringExtra > 0) {
      prepayThisMonth = roundGbp(prepayThisMonth + recurringExtra);
    }

    if (input.redundancy_bridge_liquidity_first && inJobLoss && m === U) {
      // Bridge handled via cash; prepay from surplus after payment below
    }

    let emiPaid = 0;
    if (!input.job_loss_enabled) {
      emiPaid = roundGbp(interest + principal);
      consecutiveShortfall = 0;
    } else if (cashBalance >= roundGbp(interest + principal)) {
      cashBalance = roundGbp(cashBalance - interest - principal);
      emiPaid = roundGbp(interest + principal);
      consecutiveShortfall = 0;
    } else if (paymentDue > 0) {
      const draw = drawSavings(
        roundGbp(interest + principal - cashBalance),
        cashBalance,
        isaBalance,
        giaBalance,
        giaBasis,
        input.cgt_rate_pct,
        cgtExempt,
        events,
      );
      cashBalance = draw.cash;
      isaBalance = draw.isa;
      giaBalance = draw.gia;
      giaBasis = draw.giaBasis;
      cgtExempt = draw.cgtExempt;
      if (draw.remaining > 0) {
        consecutiveShortfall += 1;
        principal = roundGbp(Math.max(0, principal - draw.remaining));
        if (!warnings.includes("MORTGAGE_DEFAULT_RISK")) {
          warnings.push("MORTGAGE_DEFAULT_RISK");
        }
      } else {
        cashBalance = roundGbp(cashBalance - interest - principal);
        emiPaid = roundGbp(interest + principal);
        consecutiveShortfall = 0;
      }
    }

    if (
      input.redundancy_bridge_liquidity_first &&
      inJobLoss &&
      m >= U &&
      netRedundancy > 0
    ) {
      const shortfall = roundGbp(
        Math.max(
          0,
          input.monthly_living_expense_inr +
            paymentDue -
            (m === U ? netRedundancy : 0) -
            (m >= U && m <= jsaEnd ? input.monthly_jsa_inr : 0),
        ),
      );
      if (shortfall > 0 && m === U) {
        // liquidity-first: already in cash from redundancy
      }
      const surplusPrepay = roundGbp(
        Math.max(0, cashBalance - input.monthly_living_expense_inr),
      );
      if (surplusPrepay > 0 && m > U) {
        const bridgePrepay = roundGbp(Math.min(surplusPrepay, balance - principal));
        if (bridgePrepay > 0) {
          prepayThisMonth = roundGbp(prepayThisMonth + bridgePrepay);
          cashBalance = roundGbp(cashBalance - bridgePrepay);
        }
      }
    }

    prepayThisMonth = roundGbp(Math.min(prepayThisMonth, balance - principal));
    if (prepayThisMonth > 0 && input.job_loss_enabled && cashBalance < prepayThisMonth) {
      const draw = drawSavings(
        roundGbp(prepayThisMonth - cashBalance),
        cashBalance,
        isaBalance,
        giaBalance,
        giaBasis,
        input.cgt_rate_pct,
        cgtExempt,
        events,
      );
      cashBalance = roundGbp(draw.cash + Math.min(prepayThisMonth, cashBalance + (prepayThisMonth - draw.remaining)));
      isaBalance = draw.isa;
      giaBalance = draw.gia;
      giaBasis = draw.giaBasis;
      cgtExempt = draw.cgtExempt;
      prepayThisMonth = roundGbp(
        Math.min(prepayThisMonth, cashBalance + prepayThisMonth),
      );
    }
    if (prepayThisMonth > 0) {
      cashBalance = roundGbp(Math.max(0, cashBalance - prepayThisMonth));
    }

    const ercResult = ercTracker.recordPrepayment(prepayThisMonth);
    if (ercResult.warning && !warnings.includes(ercResult.warning)) {
      warnings.push(ercResult.warning);
    }
    if (ercResult.fee_gbp > 0) {
      totalErcFees = roundGbp(totalErcFees + ercResult.fee_gbp);
      cashBalance = roundGbp(cashBalance - ercResult.fee_gbp);
      events.push(`erc:${ercResult.fee_gbp}`);
    }

    balance = roundGbp(opening - principal - prepayThisMonth);
    totalPrepay = roundGbp(totalPrepay + prepayThisMonth);
    totalPaid = roundGbp(totalPaid + emiPaid + prepayThisMonth + ercResult.fee_gbp);
    totalInterestIfPaidOff = roundGbp(totalInterestIfPaidOff + interest);
    if (m <= input.tenure_months) {
      totalInterestWithinTenure = roundGbp(totalInterestWithinTenure + interest);
    }
    minCash = Math.min(minCash, cashBalance);

    pushUkRow(
      rows,
      m,
      opening,
      interest,
      principal,
      prepayThisMonth,
      balance,
      emi0,
      cashBalance,
      ercResult.fee_gbp,
      smiCredit,
      smiLoanBalance,
      events,
    );

    if (consecutiveShortfall >= MAX_CONSECUTIVE_PAYMENT_SHORTFALLS) {
      if (!warnings.includes("LOAN_NOT_PAID_OFF")) {
        warnings.push("LOAN_NOT_PAID_OFF");
      }
      break;
    }
    if (balance <= BALANCE_EPS) break;
  }

  const loanPaidOff = balance <= BALANCE_EPS;
  if (!loanPaidOff && rows.length >= cap && !warnings.includes("LOAN_NOT_PAID_OFF")) {
    warnings.push("LOAN_NOT_PAID_OFF");
  }

  return {
    emi_inr: emi0,
    rows,
    totals: {
      total_paid_inr: roundGbp(totalPaid),
      total_interest_inr: roundGbp(
        loanPaidOff ? totalInterestIfPaidOff : totalInterestWithinTenure,
      ),
      total_prepayments_inr: roundGbp(totalPrepay),
      total_erc_fees_inr: roundGbp(totalErcFees),
      payoff_month: loanPaidOff ? rows.length : 0,
    },
    min_cash_balance_inr: roundGbp(minCash),
    smi_loan_balance_inr: roundGbp(smiLoanBalance),
    net_redundancy_inr: netRedundancy,
    total_jsa_received_inr: roundGbp(totalJsa),
    warnings,
  };
}

function ukBaseInput(
  input: Partial<UkCashflowSimInput> & Pick<UkCashflowSimInput, "principal_inr" | "annual_interest_rate" | "tenure_months">,
): UkCashflowSimInput {
  return {
    cash_inr: 0,
    isa_balance_inr: 0,
    gia_balance_inr: 0,
    gia_cost_basis_inr: 0,
    pension_pot_inr: 0,
    monthly_income_inr: 0,
    monthly_living_expense_inr: 0,
    monthly_extra_to_loan_inr: 0,
    job_loss_enabled: false,
    job_loss_start_month: 1,
    redundancy_payment_inr: 0,
    marginal_tax_rate_pct: 40,
    monthly_jsa_inr: 0,
    jsa_duration_months: DEFAULT_JSA_DURATION_MONTHS,
    smi_enabled: false,
    smi_wait_months: DEFAULT_SMI_WAIT_MONTHS,
    smi_rate_pct: DEFAULT_SMI_RATE_PCT,
    smi_capital_cap_inr: DEFAULT_SMI_CAPITAL_CAP_GBP,
    cgt_rate_pct: DEFAULT_CGT_RATE_PCT,
    cgt_annual_exempt_inr: DEFAULT_CGT_ANNUAL_EXEMPT_GBP,
    erc_config: { overpayment_allowance_pct: 10, erc_pct: 0 },
    keep_original_payment: true,
    ...input,
  };
}

/** Employed: baseline schedule via UK engine (ERC-aware). */
export function simulateUkBaseline(
  principal: number,
  rate: number,
  tenure: number,
  ercConfig?: ErcConfig,
): UkCashflowSimResult {
  return simulateUkCashflowSchedule(
    ukBaseInput({
      principal_inr: principal,
      annual_interest_rate: rate,
      tenure_months: tenure,
      erc_config: ercConfig ?? { overpayment_allowance_pct: 10, erc_pct: 0 },
    }),
  );
}

export function simulateUkPrepayKeepTenure(
  principal: number,
  rate: number,
  tenure: number,
  prepayMonth: number,
  prepayAmount: number,
  recurringExtra = 0,
  ercConfig?: ErcConfig,
): UkCashflowSimResult {
  return simulateUkCashflowSchedule(
    ukBaseInput({
      principal_inr: principal,
      annual_interest_rate: rate,
      tenure_months: tenure,
      monthly_extra_to_loan_inr: recurringExtra,
      erc_config: ercConfig ?? { overpayment_allowance_pct: 10, erc_pct: 0 },
      extra_prepayments: [{ month: prepayMonth, amount_inr: prepayAmount }],
    }),
  );
}

export function simulateJlRedundancyToLoan(
  input: Omit<
    UkCashflowSimInput,
    "job_loss_enabled" | "redundancy_destination" | "redundancy_bridge_liquidity_first"
  >,
): UkCashflowSimResult {
  return simulateUkCashflowSchedule({
    ...input,
    job_loss_enabled: true,
    redundancy_destination: "loan_prepay",
  });
}

export function simulateJlRedundancyBridge(
  input: Omit<
    UkCashflowSimInput,
    "job_loss_enabled" | "redundancy_destination" | "redundancy_bridge_liquidity_first"
  >,
): UkCashflowSimResult {
  return simulateUkCashflowSchedule({
    ...input,
    job_loss_enabled: true,
    redundancy_destination: "cash_buffer",
    redundancy_bridge_liquidity_first: true,
  });
}

export function simulateJlSmiSafetyNet(
  input: Omit<
    UkCashflowSimInput,
    "job_loss_enabled" | "smi_enabled" | "redundancy_destination"
  >,
): UkCashflowSimResult {
  return simulateUkCashflowSchedule({
    ...input,
    job_loss_enabled: true,
    smi_enabled: true,
    redundancy_destination: "cash_buffer",
    extra_prepayments: [],
  });
}
