import { allGuideUrls } from "../content/guides";

/** SEO helpers: tab URLs, titles, meta updates, JSON-LD, sitemap/robots builders (SPEC §8). */

export type TabId =
  | "loan"
  | "debt"
  | "retirement"
  | "strategies"
  | "strategic"
  | "budget"
  | "sip"
  | "ppf"
  | "guides";

export type PlannerTab = {
  id: TabId;
  label: string;
  /** Keyword-first SERP title without the brand suffix (§8 SEO metadata). */
  seoTitle: string;
  /** Unique meta description, 120–160 characters (§8, §10.46). */
  description: string;
};

export const PLANNER_TABS: PlannerTab[] = [
  {
    id: "loan",
    label: "Loan",
    seoTitle: "Loan EMI Calculator with Prepayment",
    description:
      "Free home loan EMI calculator with prepayment strategies, PF/401(k) unemployment planning, and full amortisation schedules for India, the US, and the UK.",
  },
  {
    id: "debt",
    label: "Multi-debt",
    seoTitle: "Debt Avalanche vs Snowball Calculator",
    description:
      "Compare debt avalanche vs snowball payoff strategies with minimum payments, budget constraints, and month-by-month payoff timelines. Free.",
  },
  {
    id: "retirement",
    label: "Retirement",
    seoTitle: "Retirement Corpus & SIP Calculator",
    description:
      "Project your retirement corpus and funded ratio with monthly SIP-style contributions, inflation, and conservative to optimistic scenarios.",
  },
  {
    id: "strategies",
    label: "Strategies",
    seoTitle: "Loan Repayment Strategy Comparison",
    description:
      "Compare equity blend, prepay heavy, and aggressive prepay household repayment strategies side by side with payoff month and total interest.",
  },
  {
    id: "strategic",
    label: "Strategic",
    seoTitle: "Loan Payoff Game Theory Explorer",
    description:
      "Explore game-theory payoff matrices for borrower, lender, household, and nature moves, built on the same amortisation engine as the loan planner.",
  },
  {
    id: "budget",
    label: "Budget",
    seoTitle: "Budget Planner with 50/30/20 Rule",
    description:
      "Plan your monthly budget with 50/30/20 analysis, emergency fund runway, and investment portfolio projections for India, the US, and the UK. Free.",
  },
  {
    id: "sip",
    label: "SIP",
    seoTitle: "SIP Calculator — Monthly Investment",
    description:
      "Free SIP calculator for monthly mutual fund investments. Project maturity value, total gains, and corpus growth chart. Compare vs loan prepay. Free.",
  },
  {
    id: "ppf",
    label: "PPF",
    seoTitle: "PPF Calculator — Public Provident Fund",
    description:
      "Free PPF calculator with annual contributions and notified interest. Year-by-year balance, interest earned, and maturity value for India savers.",
  },
  {
    id: "guides",
    label: "Guides",
    seoTitle: "Home Loan & Investment Planning Guides",
    description:
      "Free guides on loan prepayment, SIP, PPF, and PF stress tests. Each article links to the live calculator — no sign-up, privacy-first planning.",
  },
];

export const DEFAULT_SITE_URL = "https://eswarkrishna.github.io/FinancialPlanner";

export const SITE_NAME = "FinancialPlanner";

export const DEFAULT_GITHUB_REPO = "eswarkrishna/FinancialPlanner";

export const SITE_LANGUAGES = ["en-IN", "en-US", "en-GB"];

export const DEFAULT_DESCRIPTION =
  "Free loan EMI, debt payoff, retirement, and budget calculators for India, the US, and the UK. Compare prepayment strategies and amortisation schedules.";

const TAB_IDS = new Set<string>(PLANNER_TABS.map((tab) => tab.id));

export function isTabId(value: string | null | undefined): value is TabId {
  return value != null && TAB_IDS.has(value);
}

export function resolveSiteUrl(raw?: string): string {
  const url = raw?.trim() || DEFAULT_SITE_URL;
  return url.replace(/\/$/, "");
}

export function getSiteUrl(): string {
  return resolveSiteUrl(import.meta.env.VITE_SITE_URL);
}

export function getTabFromSearch(search: string): TabId {
  const param = new URLSearchParams(search).get("tab");
  return isTabId(param) ? param : "loan";
}

export function getTabFromLocation(locationLike?: Pick<Location, "search">): TabId {
  return getTabFromSearch(locationLike?.search ?? "");
}

export function tabPageUrl(tabId: TabId, siteUrl = getSiteUrl()): string {
  const base = resolveSiteUrl(siteUrl);
  if (tabId === "loan") {
    return `${base}/`;
  }
  return `${base}/?tab=${tabId}`;
}

/** Keyword-first title with brand suffix (§8 SEO metadata, §10.45). */
export function pageTitle(tabId: TabId): string {
  const tab = PLANNER_TABS.find((entry) => entry.id === tabId) ?? PLANNER_TABS[0];
  return `${tab.seoTitle} | ${SITE_NAME}`;
}

export function pageDescription(tabId: TabId): string {
  return PLANNER_TABS.find((tab) => tab.id === tabId)?.description ?? DEFAULT_DESCRIPTION;
}

export function setTabInUrl(tabId: TabId, options?: { push?: boolean }): void {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  if (tabId === "loan") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", tabId);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (options?.push) {
    window.history.pushState(null, "", next);
  } else {
    window.history.replaceState(null, "", next);
  }
}

function upsertMeta(
  selector: string,
  attributes: Record<string, string>,
): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

function upsertLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

const STRUCTURED_DATA_SCRIPT_ID = "seo-structured-data";

/** Update title, description, canonical, social tags, and JSON-LD for the active tab. */
export function updatePageSeo(tabId: TabId, siteUrl = getSiteUrl()): void {
  if (typeof document === "undefined") {
    return;
  }

  const title = pageTitle(tabId);
  const description = pageDescription(tabId);
  const canonical = tabPageUrl(tabId, siteUrl);
  const image = `${resolveSiteUrl(siteUrl)}/og-image.png`;

  document.title = title;
  upsertMeta('meta[name="description"]', { name: "description", content: description });
  upsertLink("canonical", canonical);

  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMeta('meta[property="og:description"]', {
    property: "og:description",
    content: description,
  });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });

  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: description,
  });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

  const jsonLd = buildStructuredData(siteUrl, {
    tabId,
    dateModified: import.meta.env.VITE_BUILD_COMMIT_DATE,
    githubRepo: import.meta.env.VITE_GITHUB_REPO,
  });
  let script = document.head.querySelector<HTMLScriptElement>(
    `script#${STRUCTURED_DATA_SCRIPT_ID}`,
  );
  if (!script) {
    script = document.createElement("script");
    script.id = STRUCTURED_DATA_SCRIPT_ID;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = serializeJsonLd(jsonLd);
}

export function buildRobotsTxt(siteUrl: string): string {
  const base = resolveSiteUrl(siteUrl);
  return `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
}

/** `lastmod` is an ISO timestamp or date; omitted from entries when empty (§8). */
export function buildSitemapXml(siteUrl: string, lastmod?: string): string {
  const base = resolveSiteUrl(siteUrl);
  const tabUrls = PLANNER_TABS.map((tab) => tabPageUrl(tab.id, base));
  const guideUrls = allGuideUrls(base);
  const unique = [...new Set([...tabUrls, ...guideUrls])];
  const lastmodDate = lastmod?.trim() ? lastmod.trim().slice(0, 10) : "";
  const lastmodLine = lastmodDate ? `\n    <lastmod>${lastmodDate}</lastmod>` : "";

  const body = unique
    .map(
      (loc) => `  <url>
    <loc>${loc}</loc>${lastmodLine}
    <changefreq>weekly</changefreq>
    <priority>${loc.endsWith("/") ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export type JsonLdOptions = {
  tabId?: TabId;
  /** ISO commit timestamp; `dateModified` omitted when empty (§8). */
  dateModified?: string;
  /** `owner/repo` slug for publisher sameAs; defaults to the canonical repo. */
  githubRepo?: string;
};

/** WebApplication entity per §8 SEO metadata (calculator schema used by finance sites). */
export function buildWebApplicationJsonLd(
  siteUrl: string,
  options: JsonLdOptions = {},
): Record<string, unknown> {
  const base = resolveSiteUrl(siteUrl);
  const tabId = options.tabId ?? "loan";
  const repo = options.githubRepo?.trim() || DEFAULT_GITHUB_REPO;
  const dateModified = options.dateModified?.trim() ?? "";

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: tabPageUrl(tabId, base),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    description: pageDescription(tabId),
    isAccessibleForFree: true,
    inLanguage: SITE_LANGUAGES,
    featureList: PLANNER_TABS.map((tab) => tab.seoTitle),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: `${base}/`,
      sameAs: [`https://github.com/${repo}`],
    },
    ...(dateModified ? { dateModified } : {}),
  };
}

/** Home → tab breadcrumb; `null` on the loan/home tab (§8, §10.47). */
export function buildBreadcrumbJsonLd(
  tabId: TabId,
  siteUrl: string,
): Record<string, unknown> | null {
  if (tabId === "loan") return null;
  const base = resolveSiteUrl(siteUrl);
  const tab = PLANNER_TABS.find((entry) => entry.id === tabId);
  if (!tab) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: tab.label, item: tabPageUrl(tabId, base) },
    ],
  };
}

/** All JSON-LD entities for a tab: WebApplication plus breadcrumb when applicable. */
export function buildStructuredData(
  siteUrl: string,
  options: JsonLdOptions = {},
): Array<Record<string, unknown>> {
  const tabId = options.tabId ?? "loan";
  const entities: Array<Record<string, unknown>> = [
    buildWebApplicationJsonLd(siteUrl, options),
  ];
  const breadcrumb = buildBreadcrumbJsonLd(tabId, siteUrl);
  if (breadcrumb) entities.push(breadcrumb);
  return entities;
}

export function serializeJsonLd(entities: Array<Record<string, unknown>>): string {
  const payload = entities.length === 1 ? entities[0] : entities;
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

export function buildIndexHtmlReplacements(
  siteUrl: string,
  options: Omit<JsonLdOptions, "tabId"> = {},
): Record<string, string> {
  const base = resolveSiteUrl(siteUrl);
  const image = `${base}/og-image.png`;
  const title = pageTitle("loan");
  const jsonLd = serializeJsonLd(buildStructuredData(base, { ...options, tabId: "loan" }));

  return {
    __SEO_SITE_URL__: base,
    __SEO_TITLE__: title,
    __SEO_DESCRIPTION__: DEFAULT_DESCRIPTION,
    __SEO_CANONICAL__: `${base}/`,
    __SEO_OG_IMAGE__: image,
    __SEO_JSON_LD__: jsonLd,
  };
}
