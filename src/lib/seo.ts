/** SEO helpers: tab URLs, titles, meta updates, JSON-LD, sitemap/robots builders (SPEC §8). */

export type TabId = "loan" | "debt" | "retirement" | "strategies" | "strategic" | "budget";

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
    label: "Payoff strategies",
    seoTitle: "Household Payoff Strategy Comparison",
    description:
      "Compare equity blend, prepay heavy, and aggressive prepay household repayment strategies side by side with payoff month and total interest.",
  },
  {
    id: "strategic",
    label: "What-if games",
    seoTitle: "Loan Payoff What-If Game Explorer",
    description:
      "Explore what-if payoff games for borrower, lender, household, and nature moves, built on the same amortisation engine as the loan planner.",
  },
  {
    id: "budget",
    label: "Budget",
    seoTitle: "Budget Planner with 50/30/20 Rule",
    description:
      "Plan your monthly budget with 50/30/20 analysis, emergency fund runway, and investment portfolio projections for India, the US, and the UK. Free.",
  },
];

/** Path segment per tab id (loan = home). SPEC §8 path slugs. */
export const TAB_PATH_SLUG: Record<TabId, string> = {
  loan: "",
  debt: "debt",
  retirement: "retirement",
  strategies: "payoff-strategies",
  strategic: "what-if-games",
  budget: "budget",
};

/** Former path slugs → redirect to `TAB_PATH_SLUG` (§8 Phase 4 IA). */
export const LEGACY_TAB_PATH_SLUG: Partial<Record<TabId, string>> = {
  strategies: "strategies",
  strategic: "strategic",
};

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

/** Normalize Vite `base` / `import.meta.env.BASE_URL` for pathname routing. */
export function normalizeRouterBase(base: string): string {
  if (!base || base === "./") return "/";
  const withoutTrailing = base.replace(/\/+$/, "");
  return withoutTrailing === "" || withoutTrailing === "." ? "/" : withoutTrailing;
}

export function getRouterBasePath(): string {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const base = import.meta.env.BASE_URL;
    if (typeof base === "string") {
      return normalizeRouterBase(base);
    }
  }
  return "/";
}

export function getTabFromSearch(search: string): TabId {
  const param = new URLSearchParams(search).get("tab");
  return isTabId(param) ? param : "loan";
}

function pathSegmentFromPathname(pathname: string, routerBase = getRouterBasePath()): string {
  const base = normalizeRouterBase(routerBase);
  let rest = pathname;

  if (base !== "/") {
    if (rest === base || rest === `${base}/`) {
      return "";
    }
    if (rest.startsWith(`${base}/`)) {
      rest = rest.slice(base.length);
    }
  }

  rest = rest.replace(/^\/+|\/+$/g, "");
  return rest.split("/")[0]?.toLowerCase() ?? "";
}

function tabIdFromPathSegment(segment: string): TabId | null {
  if (!segment) return "loan";

  for (const tab of PLANNER_TABS) {
    const slug = TAB_PATH_SLUG[tab.id];
    if (slug && slug === segment) {
      return tab.id;
    }
    const legacy = LEGACY_TAB_PATH_SLUG[tab.id];
    if (legacy && legacy === segment) {
      return tab.id;
    }
  }

  return null;
}

/** Resolve tab from URL pathname (§8 path slugs). Unknown segments default to loan. */
export function getTabFromPathname(pathname: string, routerBase = getRouterBasePath()): TabId {
  const segment = pathSegmentFromPathname(pathname, routerBase);
  if (!segment) {
    return "loan";
  }
  return tabIdFromPathSegment(segment) ?? "loan";
}

export function getTabFromLocation(
  locationLike?: Pick<Location, "pathname" | "search">,
): TabId {
  const pathname = locationLike?.pathname ?? "";
  const search = locationLike?.search ?? "";
  const fromPath = getTabFromPathname(pathname);
  if (fromPath !== "loan" || !search.includes("tab=")) {
    return fromPath;
  }
  return getTabFromSearch(search);
}

/** Client pathname for a tab under `routerBase` (§8). */
export function tabPathname(tabId: TabId, routerBase = getRouterBasePath()): string {
  const slug = TAB_PATH_SLUG[tabId];
  const base = normalizeRouterBase(routerBase);

  if (!slug) {
    return base === "/" ? "/" : `${base}/`;
  }
  if (base === "/") {
    return `/${slug}`;
  }
  return `${base}/${slug}`;
}

/** Path from deploy root to a tab (slug only — `siteUrl` already includes router base). */
export function tabSlugPath(tabId: TabId): string {
  const slug = TAB_PATH_SLUG[tabId];
  return slug ? `/${slug}` : "/";
}

export function tabPageUrl(tabId: TabId, siteUrl = getSiteUrl()): string {
  const base = resolveSiteUrl(siteUrl);
  const slugPath = tabSlugPath(tabId);
  if (slugPath === "/") {
    return `${base}/`;
  }
  return `${base}${slugPath}`;
}

/** Legacy `/?tab=` → path slug; preserves other query params (§10.53). */
export function redirectLegacyTabQuery(
  locationLike: Pick<Location, "href" | "pathname" | "search"> = window.location,
): TabId {
  if (typeof window === "undefined") {
    return getTabFromLocation(locationLike);
  }

  const url = new URL(locationLike.href);
  const tabParam = url.searchParams.get("tab");
  if (!isTabId(tabParam)) {
    return getTabFromLocation(locationLike);
  }

  const tabId = tabParam;
  url.searchParams.delete("tab");
  url.pathname = tabPathname(tabId);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  return tabId;
}

/** Legacy path slugs (`/strategies`, `/strategic`) → canonical paths (§8 Phase 4). */
export function redirectLegacyPathSlug(
  locationLike: Pick<Location, "href" | "pathname"> = window.location,
  routerBase = getRouterBasePath(),
): void {
  if (typeof window === "undefined") {
    return;
  }

  const tabId = getTabFromPathname(locationLike.pathname, routerBase);
  const legacy = LEGACY_TAB_PATH_SLUG[tabId];
  if (!legacy) {
    return;
  }

  const segment = pathSegmentFromPathname(locationLike.pathname, routerBase);
  if (segment !== legacy) {
    return;
  }

  const url = new URL(locationLike.href);
  url.pathname = tabPathname(tabId, routerBase);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

/** Apply legacy query + path redirects, then resolve the active tab. */
export function resolveInitialNavigation(
  locationLike: Pick<Location, "href" | "pathname" | "search"> = window.location,
): TabId {
  redirectLegacyPathSlug(locationLike);
  if (typeof window !== "undefined") {
    return redirectLegacyTabQuery(window.location);
  }
  return getTabFromLocation(locationLike);
}

/** Keyword-first title with brand suffix (§8 SEO metadata, §10.45). */
export function pageTitle(tabId: TabId): string {
  const tab = PLANNER_TABS.find((entry) => entry.id === tabId) ?? PLANNER_TABS[0];
  return `${tab.seoTitle} | ${SITE_NAME}`;
}

/** Visible `<h1>` copy per tab (keyword phrase, no brand suffix — §8, §10.56). */
export function pageHeading(tabId: TabId): string {
  return PLANNER_TABS.find((entry) => entry.id === tabId)?.seoTitle ?? PLANNER_TABS[0]!.seoTitle;
}

export function pageDescription(tabId: TabId): string {
  return PLANNER_TABS.find((tab) => tab.id === tabId)?.description ?? DEFAULT_DESCRIPTION;
}

export function setTabInUrl(tabId: TabId, options?: { push?: boolean }): void {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  url.pathname = tabPathname(tabId);
  url.searchParams.delete("tab");
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (options?.push) {
    window.history.pushState(null, "", next);
  } else {
    window.history.replaceState(null, "", next);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain-text crawler fallback per route shell (§8, §10.55). */
export function buildNoscriptHtml(tabId: TabId, routerBase = "/"): string {
  const tab = PLANNER_TABS.find((entry) => entry.id === tabId) ?? PLANNER_TABS[0]!;
  const links = PLANNER_TABS.filter((entry) => entry.id !== tabId)
    .map((entry) => {
      const href = tabPathname(entry.id, routerBase);
      return `<a href="${escapeHtml(href)}">${escapeHtml(entry.label)}</a>`;
    })
    .join(" · ");

  return `<noscript>
    <p><strong>${escapeHtml(tab.seoTitle)}</strong> — ${escapeHtml(tab.description)}</p>
    <p>Other calculators: ${links}</p>
    <p>Enable JavaScript to use the interactive calculator.</p>
  </noscript>`;
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

/** Map BCP 47 language tag or app locale to Open Graph locale (§8). */
export function ogLocaleFromLang(lang: string): string {
  if (lang === "en-US") return "en_US";
  if (lang === "en-GB") return "en_GB";
  return "en_IN";
}

/** Update title, description, canonical, social tags, and JSON-LD for the active tab. */
export function updatePageSeo(
  tabId: TabId,
  siteUrl = getSiteUrl(),
  locale?: "IN" | "US" | "UK",
): void {
  if (typeof document === "undefined") {
    return;
  }

  const title = pageTitle(tabId);
  const description = pageDescription(tabId);
  const canonical = tabPageUrl(tabId, siteUrl);
  const image = `${resolveSiteUrl(siteUrl)}/og-image.png`;
  const ogLocale =
    locale === "US" ? "en_US" : locale === "UK" ? "en_GB" : "en_IN";

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
  upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: ogLocale });

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
  const urls = PLANNER_TABS.map((tab) => tabPageUrl(tab.id, base));
  const unique = [...new Set(urls)];
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
  /** Vite `base` for noscript relative links in build shells. */
  routerBase?: string;
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
  options: JsonLdOptions = {},
): Record<string, string> {
  const tabId = options.tabId ?? "loan";
  const base = resolveSiteUrl(siteUrl);
  const image = `${base}/og-image.png`;
  const title = pageTitle(tabId);
  const description = pageDescription(tabId);
  const routerBase = normalizeRouterBase(options.routerBase ?? "/");
  const canonical = tabPageUrl(tabId, base);
  const jsonLd = serializeJsonLd(buildStructuredData(base, { ...options, tabId }));

  return {
    __SEO_SITE_URL__: base,
    __SEO_TITLE__: title,
    __SEO_DESCRIPTION__: description,
    __SEO_CANONICAL__: canonical,
    __SEO_OG_IMAGE__: image,
    __SEO_OG_LOCALE__: "en_IN",
    __SEO_JSON_LD__: jsonLd,
    __SEO_NOSCRIPT__: buildNoscriptHtml(tabId, routerBase),
  };
}

/** Patch a built `index.html` shell for a non-home tab (§8 build output). */
export function patchIndexHtmlSeo(
  html: string,
  siteUrl: string,
  tabId: TabId,
  options: Omit<JsonLdOptions, "tabId"> = {},
): string {
  const title = pageTitle(tabId);
  const description = pageDescription(tabId);
  const routerBase = normalizeRouterBase(options.routerBase ?? "/");
  const canonical = tabPageUrl(tabId, siteUrl);
  const jsonLd = serializeJsonLd(buildStructuredData(siteUrl, { ...options, tabId }));
  const noscript = buildNoscriptHtml(tabId, routerBase);

  let next = html;
  next = next.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  next = next.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeHtml(description)}"`,
  );
  next = next.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${escapeHtml(canonical)}"`,
  );
  next = next.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${escapeHtml(title)}"`,
  );
  next = next.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${escapeHtml(description)}"`,
  );
  next = next.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${escapeHtml(canonical)}"`,
  );
  next = next.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${escapeHtml(title)}"`,
  );
  next = next.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${escapeHtml(description)}"`,
  );
  next = next.replace(
    /<script type="application\/ld\+json" id="seo-structured-data">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="seo-structured-data">${jsonLd}</script>`,
  );
  if (/<noscript>[\s\S]*?<\/noscript>/.test(next)) {
    next = next.replace(/<noscript>[\s\S]*?<\/noscript>/, noscript);
  } else {
    next = next.replace("<div id=\"root\">", `${noscript}\n    <div id="root">`);
  }
  return next;
}

/** Slug directories emitted under `dist/` for non-home tabs (§8, §10.54). */
export const SEO_ROUTE_SLUGS = PLANNER_TABS.map((tab) => TAB_PATH_SLUG[tab.id]).filter(
  (slug) => slug.length > 0,
);

/** Build a legacy-path shell that points canonical + refresh to the new slug (§8 Phase 4). */
export function buildLegacyRedirectShell(
  canonicalShellHtml: string,
  tabId: TabId,
  siteUrl: string,
  routerBase = "/",
): string {
  const canonical = tabPageUrl(tabId, siteUrl);
  const targetPath = tabPathname(tabId, routerBase);
  let next = canonicalShellHtml.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${escapeHtml(canonical)}"`,
  );
  next = next.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${escapeHtml(canonical)}"`,
  );
  const refresh = `<meta http-equiv="refresh" content="0;url=${escapeHtml(targetPath)}" />`;
  next = next.replace('<div id="root">', `${refresh}\n    <div id="root">`);
  return next;
}