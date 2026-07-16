import type { TabId } from "../lib/seo";

export type GuidePage = {
  slug: string;
  title: string;
  description: string;
  /** SPA tab to open from CTA */
  tab: TabId;
  keywords: string[];
  sections: { heading: string; body: string }[];
};

export const GUIDE_PAGES: GuidePage[] = [
  {
    slug: "home-loan-prepayment-calculator",
    title: "Home Loan Prepayment Calculator — India",
    description:
      "Model lump-sum and monthly prepayments on a reducing-balance home loan. Compare reduce tenure vs reduce EMI, prepayment fees, and interest saved.",
    tab: "loan",
    keywords: ["home loan prepayment", "EMI calculator", "reduce tenure"],
    sections: [
      {
        heading: "Why prepayment matters",
        body: "On a typical home loan, interest dominates early EMIs. Even modest extra principal payments can shave years off tenure and lakhs off total interest — especially when rates are high.",
      },
      {
        heading: "Reduce tenure vs reduce EMI",
        body: "Indian lenders usually let you choose: keep the same EMI and finish sooner (reduce tenure), or lower your monthly EMI while keeping the original end date (reduce EMI). Our loan tab shows both side by side with net savings after prepayment fees.",
      },
      {
        heading: "Try it now",
        body: "Open the interactive loan calculator, enter your outstanding balance, rate, and remaining tenure, then add a one-time or recurring prepayment to see payoff month and interest saved.",
      },
    ],
  },
  {
    slug: "reduce-tenure-vs-reduce-emi",
    title: "Reduce Tenure vs Reduce EMI — Which Wins?",
    description:
      "Side-by-side comparison of prepayment policies on Indian home loans: payoff months, new EMI, total interest, and net savings after lender fees.",
    tab: "loan",
    keywords: ["reduce tenure", "reduce EMI", "prepayment policy"],
    sections: [
      {
        heading: "Keep EMI, shorten loan",
        body: "Best when you can afford the current EMI and want maximum interest savings. Each prepayment pulls forward your debt-free date without changing monthly cash flow.",
      },
      {
        heading: "Keep tenure, lower EMI",
        body: "Best when you need monthly relief — for example after a rate hike or income change. Total interest saved is usually lower than the tenure-reduction path for the same prepay amount.",
      },
      {
        heading: "Include prepayment fees",
        body: "Fixed-rate loans may carry foreclosure or part-prepayment charges. Toggle fee type (flat or percent) so net savings reflect what you actually keep.",
      },
    ],
  },
  {
    slug: "sip-calculator-india",
    title: "SIP Calculator — Systematic Investment Plan",
    description:
      "Project SIP maturity value with monthly investments, expected annual return, and duration. See total invested vs gains with a growth chart.",
    tab: "sip",
    keywords: ["SIP calculator", "mutual fund SIP", "monthly investment"],
    sections: [
      {
        heading: "What is SIP?",
        body: "A Systematic Investment Plan invests a fixed amount each month into mutual funds or similar vehicles. Compounding works on both prior corpus and new contributions.",
      },
      {
        heading: "Prepay vs invest",
        body: "If your loan rate is high and guaranteed, prepaying often beats market returns on a risk-adjusted basis. If your rate is low after tax benefits, SIP may offer higher nominal returns — with volatility. Use the loan and SIP tabs together.",
      },
    ],
  },
  {
    slug: "ppf-calculator-india",
    title: "PPF Calculator — Public Provident Fund",
    description:
      "Estimate PPF maturity with annual contributions and government-notified interest. Year-by-year balance and total interest earned.",
    tab: "ppf",
    keywords: ["PPF calculator", "Public Provident Fund", "80C"],
    sections: [
      {
        heading: "PPF basics",
        body: "PPF is a long-term, government-backed savings scheme with tax benefits under Section 80C (educational only — verify current rules). Interest is credited annually.",
      },
      {
        heading: "Default rate",
        body: "We pre-fill a recent notified rate; always confirm the current rate on official government sources before deciding.",
      },
    ],
  },
  {
    slug: "pf-unemployment-stress-test",
    title: "PF Withdrawal Stress Test — Job Loss Planning",
    description:
      "Model staged PF withdrawals during unemployment alongside loan EMIs and cash runway. Educational stress test — not EPFO eligibility advice.",
    tab: "loan",
    keywords: ["PF withdrawal", "unemployment", "job loss loan"],
    sections: [
      {
        heading: "Liquidity under stress",
        body: "Toggle unemployment mode on the loan tab to simulate staged PF access, cash buffer vs loan prepay splits, and minimum cash balance warnings.",
      },
      {
        heading: "Disclaimer",
        body: "Withdrawal fractions in this tool are a planning fiction for stress testing. Real EPFO Form 31 rules differ — verify with EPFO and your employer.",
      },
    ],
  },
];

export function guideBySlug(slug: string): GuidePage | undefined {
  return GUIDE_PAGES.find((guide) => guide.slug === slug);
}

export function guidePageUrl(slug: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/guides/${slug}.html`;
}

export function allGuideUrls(siteUrl: string): string[] {
  return GUIDE_PAGES.map((guide) => guidePageUrl(guide.slug, siteUrl));
}
