/** SEO helpers: tab URLs, titles, meta updates, sitemap/robots builders. */

export type TabId = "loan" | "debt" | "retirement" | "strategies" | "strategic" | "budget";

export type PlannerTab = {
  id: TabId;
  label: string;
  description: string;
};

export const PLANNER_TABS: PlannerTab[] = [
  {
    id: "loan",
    label: "Loan",
    description:
      "Home loan EMI calculator with prepayment, PF/401(k) unemployment tranches, and amortisation schedules for India and the US.",
  },
  {
    id: "debt",
    label: "Multi-debt",
    description:
      "Compare debt avalanche vs snowball payoff strategies with minimum payment and budget constraints.",
  },
  {
    id: "retirement",
    label: "Retirement",
    description:
      "Project retirement corpus growth and funded ratio with monthly SIP-style contributions.",
  },
  {
    id: "strategies",
    label: "Strategies",
    description:
      "Compare equity blend, prepay heavy, and aggressive prepay household repayment strategies.",
  },
  {
    id: "strategic",
    label: "Strategic",
    description:
      "Explore game-theory payoff matrices for borrower vs lender or household strategic choices.",
  },
  {
    id: "budget",
    label: "Budget",
    description:
      "Personal monthly budget planner with 50/30/20 analysis, emergency fund runway, and investment portfolio tracking.",
  },
];

export const DEFAULT_SITE_URL = "https://eswarkrishna.github.io/FinancialPlanner";

export const SITE_NAME = "FinancialPlanner";

export const DEFAULT_DESCRIPTION =
  "Free loan payoff calculator for India and the US. Compare prepayment strategies, EMI schedules, PF/401(k) unemployment scenarios, debt avalanche vs snowball, retirement projections, and personal budgeting.";

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

export function pageTitle(tabLabel: string): string {
  return `${SITE_NAME} — ${tabLabel}`;
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

/** Update title, description, canonical, and social tags for the active tab. */
export function updatePageSeo(tabId: TabId, siteUrl = getSiteUrl()): void {
  if (typeof document === "undefined") {
    return;
  }

  const tab = PLANNER_TABS.find((entry) => entry.id === tabId) ?? PLANNER_TABS[0];
  const title = pageTitle(tab.label);
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
}

export function buildRobotsTxt(siteUrl: string): string {
  const base = resolveSiteUrl(siteUrl);
  return `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
}

export function buildSitemapXml(siteUrl: string): string {
  const base = resolveSiteUrl(siteUrl);
  const urls = PLANNER_TABS.map((tab) => tabPageUrl(tab.id, base));
  const unique = [...new Set(urls)];

  const body = unique
    .map(
      (loc) => `  <url>
    <loc>${loc}</loc>
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

export function buildJsonLd(siteUrl: string): Record<string, unknown> {
  const base = resolveSiteUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: `${base}/`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: DEFAULT_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  };
}

export function buildIndexHtmlReplacements(siteUrl: string): Record<string, string> {
  const base = resolveSiteUrl(siteUrl);
  const image = `${base}/og-image.png`;
  const title = pageTitle("Loan & debt payoff planner");
  const jsonLd = JSON.stringify(buildJsonLd(base)).replace(/</g, "\\u003c");

  return {
    __SEO_SITE_URL__: base,
    __SEO_TITLE__: title,
    __SEO_DESCRIPTION__: DEFAULT_DESCRIPTION,
    __SEO_CANONICAL__: `${base}/`,
    __SEO_OG_IMAGE__: image,
    __SEO_JSON_LD__: jsonLd,
  };
}
