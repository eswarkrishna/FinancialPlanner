import { pageHeading, tabPathname, type TabId } from "./seo";

/** Count words for §10.58 explainer bounds. */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export type RelatedCalculatorLink = {
  tabId: TabId;
  /** One-line context shown beside the link (§8 internal linking). */
  blurb: string;
};

/** Contextual cross-links per tab (§8, §10.57). */
export const RELATED_CALCULATOR_LINKS: Record<TabId, RelatedCalculatorLink[]> = {
  loan: [
    {
      tabId: "retirement",
      blurb: "Project how freed-up EMI cash could grow in a retirement corpus.",
    },
    {
      tabId: "strategies",
      blurb: "Compare prepay-heavy vs equity-blend household strategies.",
    },
  ],
  debt: [
    {
      tabId: "budget",
      blurb: "Check whether your monthly budget can fund extra debt payments.",
    },
    {
      tabId: "loan",
      blurb: "Model a single mortgage with prepayment and amortisation detail.",
    },
  ],
  retirement: [
    {
      tabId: "ppf",
      blurb: "Model PPF maturity separately from your broader retirement corpus.",
    },
    {
      tabId: "budget",
      blurb: "Align SIP-style contributions with your monthly savings rate.",
    },
    {
      tabId: "loan",
      blurb: "See how outstanding loans affect long-term cashflow before retiring.",
    },
  ],
  ppf: [
    {
      tabId: "sip",
      blurb: "Compare mutual-fund SIP growth with your PPF deposits.",
    },
    {
      tabId: "retirement",
      blurb: "Combine PPF with EPF/NPS and SIP-style projections for retirement.",
    },
    {
      tabId: "budget",
      blurb: "Check whether your monthly budget can fund the annual PPF deposit.",
    },
  ],
  sip: [
    {
      tabId: "ppf",
      blurb: "Balance market SIP projections with government-backed PPF savings.",
    },
    {
      tabId: "retirement",
      blurb: "See how this SIP corpus fits your inflation-adjusted retirement target.",
    },
  ],
  strategies: [
    {
      tabId: "loan",
      blurb: "Drill into EMI, prepayment fees, and schedule exports for one loan.",
    },
    {
      tabId: "strategic",
      blurb: "Explore game-theory payoff matrices on the same loan engine.",
    },
  ],
  strategic: [
    {
      tabId: "strategies",
      blurb: "Compare deterministic repayment blends without the payoff matrix.",
    },
    {
      tabId: "loan",
      blurb: "Adjust principal, rate, and prepayments behind the matrix.",
    },
  ],
  budget: [
    {
      tabId: "debt",
      blurb: "Apply your surplus cash to avalanche or snowball debt payoff.",
    },
    {
      tabId: "retirement",
      blurb: "Turn the savings bucket into a retirement corpus projection.",
    },
  ],
};

export function getRelatedCalculatorLinks(tabId: TabId): RelatedCalculatorLink[] {
  return RELATED_CALCULATOR_LINKS[tabId];
}

/** Visible explainer copy per tab — 100–200 words (§8, §10.58). */
export const TAB_EXPLAINERS: Record<TabId, string> = {
  loan: `This calculator uses the standard reducing-balance EMI formula: monthly payment equals principal times the monthly rate times (one plus rate) to the power of tenure, divided by that power minus one. Each month, interest is charged on the outstanding balance and the rest of your payment reduces principal. Enter loan amount, fixed annual rate, and tenure in months to see baseline EMI, total interest, and payoff month. Prepayment options model lump sums from cash, gold liquidation, or provident fund withdrawals, with policies to keep EMI unchanged or shorten tenure. For example, on a fifty-lakh rupee loan at 7.9 percent over 168 months, baseline EMI is roughly forty-five thousand rupees; a twenty-five-lakh prepayment at month one can cut total interest substantially depending on the policy you choose. Unemployment mode layers staged PF withdrawals and cashflow stress on top of the same schedule. Comparison tables show side-by-side scenarios with exportable amortisation rows. Numbers are educational illustrations, not lender quotes or tax advice.`,

  debt: `The debt payoff planner compares avalanche and snowball strategies on multiple balances. Avalanche applies any extra payment to the highest APR debt first, which usually minimises total interest when you can cover all minimums. Snowball pays the smallest balance first for quicker psychological wins, which may cost more interest when rates differ. Enter each debt name, balance, APR, and minimum payment, then set a monthly budget above those minimums. The engine pays minimums on every account, routes surplus per your chosen strategy, and stops when all balances reach zero. For example, with a high-rate card at 24 percent and a lower personal loan at 12 percent, avalanche typically finishes with less interest paid than snowball under the same budget. The timeline table shows month-by-month balances so you can see when each debt clears. Warnings appear if your budget cannot cover required minimums. Use this alongside the budget tab to confirm your surplus is realistic before committing to a payoff order.`,

  retirement: `Retirement corpus projection compounds your current savings plus monthly contributions at an assumed annual return, then compares the result to an inflation-adjusted target. The funded ratio is projected corpus divided by target corpus; values above one mean you are on track on paper. Enter current age, retirement age, existing corpus, monthly contribution, expected return, inflation, and target replacement income to build conservative, base, and optimistic scenarios. For example, starting with ten lakh rupees, contributing ten thousand per month for twenty years at 10 percent nominal return grows the corpus materially; raising inflation increases the target you must hit in future rupees. The yearly timeline chart shows nominal balance by year; scenario cards rank outcomes by funded ratio. This is a simplified SIP-style model without tax, pension rules, or annuity purchase costs. Pair it with the loan and budget tools to see whether debt payments or living expenses leave enough room for contributions.`,

  ppf: `The Public Provident Fund calculator projects how annual deposits grow with government-notified interest compounded once per year. Enter your current PPF balance, planned yearly contribution, interest rate, and projection horizon to see maturity value, total contributed, and interest earned. For example, contributing one lakh fifty thousand per year for fifteen years at seven point one percent from a zero opening balance grows to roughly forty lakh sixty-eight thousand — about eighteen lakh in interest on twenty-two lakh fifty thousand of deposits. The yearly table shows opening balance, contribution, interest credited, and closing balance each year. This model assumes deposits at the start of each year and does not apply the monthly lowest-balance rule used for official interest crediting. PPF has a fifteen-year minimum account term and annual deposit limits; tax deduction under Section 80C is not modelled. Verify the latest notified rate on NSC or India Post before relying on numbers for decisions. Pair with the retirement tab for a broader EPF, NPS, and SIP view.`,

  sip: `The SIP calculator projects how a fixed monthly mutual-fund instalment grows when returns compound every month at an illustrative annual rate. Enter an opening balance, monthly SIP amount, expected return, and years to see maturity value, total invested, and gains. For example, ten thousand rupees per month for ten years at twelve percent from zero grows to about twenty-three lakh — roughly eleven lakh in gains on twelve lakh invested. Each month the model adds growth on the current balance, then your instalment, matching the same monthly engine used on the retirement tab. Expense ratios, capital-gains tax, exit loads, and step-up SIP are not included. Returns are educational assumptions, not fund forecasts or investment advice. Use the PPF tab for government-backed savings and the retirement tab when you need inflation-adjusted targets and funded-ratio scenarios. Export the yearly timeline as CSV for your own spreadsheet.`,

  strategies: `Household repayment strategies split extra cash between investing and loan prepayment using fixed rules. The equity blend strategy sends a portion of surplus to an equity sleeve first, then applies the remainder as extra principal. Prepay-heavy and aggressive prepay variants route more cash straight to the loan, shortening payoff and cutting interest at the cost of lower invested balances at the horizon. Each strategy uses the same underlying loan amortisation engine as the loan tab, so principal, rate, tenure, and prepayment timing stay consistent. Comparison rows show payoff month, total interest, ending net worth, and allocation breakdown at the horizon you choose. For example, on a long home loan with moderate extra monthly cash, aggressive prepay may finish years earlier while equity blend keeps more assets in the market. Pick a strategy card to inspect allocation bars and export comparison numbers. These are planning sketches, not investment recommendations or lender-specific product rules.`,

  strategic: `The strategic tab builds payoff matrices from discrete actions by the borrower, lender, household, and nature player profiles defined in the game engine. Each cell scores outcomes such as net worth at a horizon, fee income, or cash runway under unemployment timing, prepayment size, and lender fee policies you select. A heatmap highlights stronger cells; the recommendation panel surfaces a suggested action profile from the matrix. Unlike the deterministic strategy comparison, this view is meant for what-if exploration when incentives conflict, for example prepaying versus keeping liquidity during job loss. Results reuse the same amortisation and cashflow core as the loan planner, so matrix numbers trace back to real schedule math. Start from a strategic scenario preset, read warnings for infeasible cash paths, and export the grid for offline review. This is an educational game-theory lab, not a prediction of lender behaviour or legal settlement outcomes.`,

  budget: `The personal budget planner totals income and expense lines, classifies spending into needs, wants, and savings buckets, and compares your mix to a fifty-thirty-twenty guideline. Needs should be near fifty percent of take-home pay, wants near thirty percent, and savings near twenty percent, though your targets can differ. Net cash flow is income minus expenses; savings rate is net flow divided by income. Investment holdings add a simple projection: current value plus monthly contributions compounded at each asset expected return. For example, with one lakh seventy-five thousand income and one lakh forty thousand expenses, net flow is thirty-five thousand and savings rate is twenty percent; adding a monthly ten-thousand contribution to a twelve-percent sleeve grows the portfolio on the summary chart. Emergency fund runway divides liquid savings by essential monthly costs. Deficit warnings fire when expenses exceed income. Export CSV or JSON for your own spreadsheet. Figures exclude tax withholding nuances and live bank feeds by design.`,
};

export function getTabExplainer(tabId: TabId): string {
  return TAB_EXPLAINERS[tabId];
}

export function relatedCalculatorHref(tabId: TabId): string {
  return tabPathname(tabId);
}

export function relatedCalculatorLabel(tabId: TabId): string {
  return pageHeading(tabId);
}
