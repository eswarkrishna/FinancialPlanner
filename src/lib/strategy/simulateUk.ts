import { roundGbp } from "../money";
import {
  DEFAULT_CGT_ANNUAL_EXEMPT_GBP,
  DEFAULT_CGT_RATE_PCT,
  DEFAULT_ISA_ANNUAL_ALLOWANCE_GBP,
  DEFAULT_OVERPAYMENT_ALLOWANCE_PCT,
  DEFAULT_ERC_PCT,
  DEFAULT_PENSION_ANNUAL_RETURN_PCT,
} from "../uk/constants";
import { computeEmi } from "../loan/emi";
import {
  simulateUkBaseline,
  simulateUkCashflowSchedule,
} from "../loan/cashflowUk";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";
import {
  EQUITY_BLEND_EXTRA_TO_PRINCIPAL_FRACTION,
  EQUITY_BLEND_PREPAY_FRACTION,
  FRAGILE_CASH_FLOW_RATIO,
} from "./constants";
import { projectPfCorpusMonths } from "./projection";
import type {
  StrategyId,
  StrategyInputs,
  StrategyResult,
  StrategyWarning,
} from "./types";

interface StrategyAllocation {
  oneTimePrepayInr: number;
  monthlyExtraPrincipalInr: number;
  monthlySipInr: number;
  equityLumpInr: number;
  postLoanRedirectInr: number;
}

function postTaxExtra(input: StrategyInputs): number {
  const raw = Math.max(0, input.extra_monthly_income_inr);
  if (input.extra_income_post_tax) return raw;
  const factor = Math.max(0, 1 - Math.max(0, input.marginal_tax_rate_pct) / 100);
  return roundGbp(raw * factor);
}

function clampPct(pct: number | undefined): { clamped: number; invalid: boolean } {
  if (pct === undefined || Number.isNaN(pct)) return { clamped: 0, invalid: false };
  if (pct < 0) return { clamped: 0, invalid: true };
  if (pct > 100) return { clamped: 100, invalid: true };
  return { clamped: pct, invalid: false };
}

function allocate(
  strategyId: StrategyId,
  input: StrategyInputs,
  emi0: number,
  deployable: number,
  extra: number,
): { allocation: StrategyAllocation; pctInvalid: boolean } {
  if (strategyId === "STRATEGY_EQUITY_BLEND") {
    const oneTime = roundGbp(deployable * EQUITY_BLEND_PREPAY_FRACTION);
    const lump = roundGbp(deployable - oneTime);
    const monthlyExtra = roundGbp(extra * EQUITY_BLEND_EXTRA_TO_PRINCIPAL_FRACTION);
    const sip = roundGbp(extra - monthlyExtra);
    return {
      allocation: {
        oneTimePrepayInr: oneTime,
        monthlyExtraPrincipalInr: monthlyExtra,
        monthlySipInr: sip,
        equityLumpInr: lump,
        postLoanRedirectInr: roundGbp(emi0 + extra),
      },
      pctInvalid: false,
    };
  }
  if (strategyId === "STRATEGY_PREPAY_HEAVY") {
    return {
      allocation: {
        oneTimePrepayInr: deployable,
        monthlyExtraPrincipalInr: extra,
        monthlySipInr: 0,
        equityLumpInr: 0,
        postLoanRedirectInr: roundGbp(emi0 + extra),
      },
      pctInvalid: false,
    };
  }
  const { clamped, invalid } = clampPct(input.repayment_pct_of_take_home);
  const committedFromTakeHome = roundGbp((clamped / 100) * input.monthly_take_home_inr);
  const committedToLoan = roundGbp(committedFromTakeHome + extra);
  const monthlyExtra = Math.max(0, roundGbp(committedToLoan - emi0));
  return {
    allocation: {
      oneTimePrepayInr: deployable,
      monthlyExtraPrincipalInr: monthlyExtra,
      monthlySipInr: 0,
      equityLumpInr: 0,
      postLoanRedirectInr: committedToLoan,
    },
    pctInvalid: invalid,
  };
}

/** ISA-first sleeve: fill annual allowance per 12-month block, remainder to GIA. */
function projectIsaGiaSleeve(
  initialIsa: number,
  initialGia: number,
  initialGiaBasis: number,
  lumpInr: number,
  monthlyContribInr: number,
  months: number,
  annualReturnPct: number,
  isaAnnualAllowance: number,
  cgtRatePct: number,
  cgtExempt: number,
): {
  isaCorpus: number;
  giaCorpus: number;
  giaBasis: number;
  postTaxCorpus: number;
  warnings: StrategyWarning[];
} {
  const warnings: StrategyWarning[] = [];
  const r = nominalMonthlyRateFromAnnualPercent(Math.max(0, annualReturnPct));
  let isa = roundGbp(Math.max(0, initialIsa));
  let gia = roundGbp(Math.max(0, initialGia));
  let giaBasis = roundGbp(Math.max(0, initialGiaBasis));
  let allowanceLeft = roundGbp(isaAnnualAllowance);

  const contribute = (amount: number) => {
    if (amount <= 0) return;
    const toIsa = roundGbp(Math.min(amount, allowanceLeft));
    const toGia = roundGbp(amount - toIsa);
    isa = roundGbp(isa + toIsa);
    gia = roundGbp(gia + toGia);
    giaBasis = roundGbp(giaBasis + toGia);
    allowanceLeft = roundGbp(allowanceLeft - toIsa);
  };

  const safeMonths = Math.max(0, Math.floor(months));
  if (lumpInr > 0) {
    contribute(lumpInr);
  }
  for (let m = 1; m <= safeMonths; m += 1) {
    if (m > 1 && (m - 1) % 12 === 0) {
      allowanceLeft = roundGbp(isaAnnualAllowance);
    }
    if (monthlyContribInr > 0) {
      contribute(monthlyContribInr);
    }
    const isaGrowth = roundGbp(isa * r);
    const giaGrowth = roundGbp(gia * r);
    isa = roundGbp(isa + isaGrowth);
    gia = roundGbp(gia + giaGrowth);
  }

  const giaGain = Math.max(0, roundGbp(gia - giaBasis));
  const taxableGain = Math.max(0, roundGbp(giaGain - cgtExempt));
  const cgtTax = roundGbp((taxableGain * cgtRatePct) / 100);
  const postTaxCorpus = roundGbp(isa + gia - cgtTax);
  if (cgtExempt === 0 || cgtRatePct > 0) {
    warnings.push("TAX_SIMPLIFIED");
  }

  return {
    isaCorpus: isa,
    giaCorpus: gia,
    giaBasis,
    postTaxCorpus,
    warnings,
  };
}

/** SPEC-UK §4.12 — UK strategy with ERC-aware loan + ISA-first equity sleeve. */
export function simulateStrategyUk(
  strategyId: StrategyId,
  input: StrategyInputs,
): StrategyResult {
  const warnings: StrategyWarning[] = [];
  const emi0 = computeEmi(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
  );

  const baseline = simulateUkBaseline(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
    {
      overpayment_allowance_pct:
        input.erc_overpayment_allowance_pct ?? DEFAULT_OVERPAYMENT_ALLOWANCE_PCT,
      erc_pct: input.erc_pct ?? DEFAULT_ERC_PCT,
    },
  );

  const buffer = roundGbp(
    Math.max(0, input.emergency_months_buffer) *
      (Math.max(0, input.monthly_living_expense_inr) + emi0),
  );
  const cashShortfall = input.cash_inr < buffer;
  if (cashShortfall) warnings.push("EMERGENCY_FUND_SHORTFALL");
  const deployable = cashShortfall
    ? 0
    : roundGbp(Math.max(0, input.cash_inr - buffer));
  const cashBufferRemaining = cashShortfall
    ? roundGbp(Math.max(0, input.cash_inr))
    : roundGbp(input.cash_inr - deployable);

  if (
    input.monthly_take_home_inr > 0 &&
    emi0 > FRAGILE_CASH_FLOW_RATIO * input.monthly_take_home_inr
  ) {
    warnings.push("FRAGILE_CASH_FLOW");
  }

  const extra = postTaxExtra(input);
  const { allocation, pctInvalid } = allocate(
    strategyId,
    input,
    emi0,
    deployable,
    extra,
  );
  if (pctInvalid) warnings.push("AGGRESSIVE_PCT_INVALID");

  const ercConfig = {
    overpayment_allowance_pct:
      input.erc_overpayment_allowance_pct ?? DEFAULT_OVERPAYMENT_ALLOWANCE_PCT,
    erc_pct: input.erc_pct ?? DEFAULT_ERC_PCT,
  };

  const loanRun = simulateUkCashflowSchedule({
    principal_inr: input.principal_inr,
    annual_interest_rate: input.annual_interest_rate,
    tenure_months: input.tenure_months,
    cash_inr: input.cash_inr,
    isa_balance_inr: 0,
    gia_balance_inr: 0,
    gia_cost_basis_inr: 0,
    pension_pot_inr: input.pf_corpus_inr,
    monthly_income_inr: 0,
    monthly_living_expense_inr: 0,
    monthly_extra_to_loan_inr: allocation.monthlyExtraPrincipalInr,
    job_loss_enabled: false,
    job_loss_start_month: 1,
    redundancy_payment_inr: 0,
    marginal_tax_rate_pct: 20,
    monthly_jsa_inr: 0,
    jsa_duration_months: 6,
    smi_enabled: false,
    smi_wait_months: 3,
    smi_rate_pct: 3.66,
    smi_capital_cap_inr: 200_000,
    cgt_rate_pct: input.ltcg_rate_pct ?? DEFAULT_CGT_RATE_PCT,
    cgt_annual_exempt_inr: input.ltcg_exemption_inr ?? DEFAULT_CGT_ANNUAL_EXEMPT_GBP,
    erc_config: ercConfig,
    keep_original_payment: true,
    extra_prepayments:
      allocation.oneTimePrepayInr > 0
        ? [{ month: 1, amount_inr: allocation.oneTimePrepayInr }]
        : [],
  });

  for (const w of loanRun.warnings) {
    if (w === "ERC_ALLOWANCE_EXCEEDED" && !warnings.includes("ERC_ALLOWANCE_EXCEEDED")) {
      warnings.push("ERC_ALLOWANCE_EXCEEDED");
    }
  }

  const loanCloseMonth = loanRun.totals.payoff_month;
  const horizon = Math.max(0, Math.floor(input.horizon_months));
  if (horizon < loanCloseMonth) warnings.push("HORIZON_TOO_SHORT");

  const monthsInLoanPhase = Math.min(loanCloseMonth, horizon);
  const monthsPostLoan = Math.max(0, horizon - loanCloseMonth);

  const isaAllowance = input.isa_annual_allowance_inr ?? DEFAULT_ISA_ANNUAL_ALLOWANCE_GBP;
  const cgtRate = input.ltcg_rate_pct ?? DEFAULT_CGT_RATE_PCT;
  const cgtExempt = input.ltcg_exemption_inr ?? DEFAULT_CGT_ANNUAL_EXEMPT_GBP;

  const loanPhaseSleeve = projectIsaGiaSleeve(
    0,
    0,
    0,
    allocation.equityLumpInr,
    allocation.monthlySipInr,
    monthsInLoanPhase,
    input.expected_equity_return_pct,
    isaAllowance,
    cgtRate,
    cgtExempt,
  );
  warnings.push(...loanPhaseSleeve.warnings.filter((w) => !warnings.includes(w)));

  let equityCorpus = roundGbp(loanPhaseSleeve.isaCorpus + loanPhaseSleeve.giaCorpus);
  let equityPostTax = loanPhaseSleeve.postTaxCorpus;

  if (monthsPostLoan > 0) {
    const postLoanSleeve = projectIsaGiaSleeve(
      loanPhaseSleeve.isaCorpus,
      loanPhaseSleeve.giaCorpus,
      loanPhaseSleeve.giaBasis,
      0,
      allocation.postLoanRedirectInr,
      monthsPostLoan,
      input.expected_equity_return_pct,
      isaAllowance,
      cgtRate,
      cgtExempt,
    );
    for (const w of postLoanSleeve.warnings) {
      if (!warnings.includes(w)) warnings.push(w);
    }
    equityCorpus = roundGbp(postLoanSleeve.isaCorpus + postLoanSleeve.giaCorpus);
    equityPostTax = postLoanSleeve.postTaxCorpus;
  }

  const pensionRate =
    input.pension_annual_return_pct ??
    input.pf_annual_interest_rate_pct ??
    DEFAULT_PENSION_ANNUAL_RETURN_PCT;
  const pfCorpusAtHorizon = projectPfCorpusMonths(
    input.pf_corpus_inr,
    input.monthly_pf_addition_inr,
    pensionRate,
    horizon,
  );

  const loanBalanceAtHorizon =
    horizon >= loanCloseMonth
      ? 0
      : roundGbp(Math.max(0, loanRun.rows[horizon - 1]?.closing_inr ?? 0));

  const netWorthAtHorizon = roundGbp(
    equityCorpus + cashBufferRemaining + pfCorpusAtHorizon - loanBalanceAtHorizon,
  );

  const minLivingBudget = roundGbp(
    input.monthly_take_home_inr +
      extra -
      (emi0 +
        allocation.monthlyExtraPrincipalInr +
        allocation.monthlySipInr),
  );
  const subsistence = input.subsistence_floor_inr ?? 1_500;
  if (minLivingBudget < subsistence) {
    warnings.push("BELOW_SUBSISTENCE");
  }

  const ercFees = loanRun.totals.total_erc_fees_inr ?? 0;
  const interestSaved = roundGbp(
    baseline.totals.total_interest_inr - loanRun.totals.total_interest_inr,
  );

  return {
    strategy_id: strategyId,
    loan_close_month: loanCloseMonth,
    total_interest_inr: loanRun.totals.total_interest_inr,
    interest_saved_vs_base_inr: interestSaved,
    one_time_prepay_inr: allocation.oneTimePrepayInr,
    monthly_extra_principal_inr: allocation.monthlyExtraPrincipalInr,
    monthly_sip_inr: allocation.monthlySipInr,
    equity_lump_inr: allocation.equityLumpInr,
    equity_corpus_at_horizon_inr: equityCorpus,
    equity_corpus_at_horizon_post_tax_inr: equityPostTax,
    pf_corpus_at_horizon_inr: pfCorpusAtHorizon,
    cash_buffer_remaining_inr: cashBufferRemaining,
    loan_balance_at_horizon_inr: loanBalanceAtHorizon,
    net_worth_at_horizon_inr: netWorthAtHorizon,
    min_living_budget_inr: minLivingBudget,
    erc_fees_inr: ercFees,
    warnings,
  };
}

export function simulateAllStrategiesUk(input: StrategyInputs): StrategyResult[] {
  const ids: StrategyId[] = [
    "STRATEGY_EQUITY_BLEND",
    "STRATEGY_PREPAY_HEAVY",
    "STRATEGY_AGGRESSIVE_PREPAY",
  ];
  return ids.map((id) => simulateStrategyUk(id, input));
}
