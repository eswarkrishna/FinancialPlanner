import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  buildBreadcrumbJsonLd,
  buildIndexHtmlReplacements,
  buildNoscriptHtml,
  buildRobotsTxt,
  buildSitemapXml,
  buildStructuredData,
  buildWebApplicationJsonLd,
  getTabFromLocation,
  getTabFromPathname,
  getTabFromSearch,
  pageDescription,
  pageHeading,
  pageTitle,
  PLANNER_TABS,
  redirectLegacyTabQuery,
  resolveSiteUrl,
  SEO_ROUTE_SLUGS,
  setTabInUrl,
  tabPageUrl,
  tabPathname,
  updatePageSeo,
} from "./seo";

describe("seo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    document.head.innerHTML = "";
    document.title = "";
  });

  it("resolves site URL without trailing slash", () => {
    expect(resolveSiteUrl("https://example.com/app/")).toBe("https://example.com/app");
  });

  it("parses tab query param (legacy)", () => {
    expect(getTabFromSearch("?tab=debt")).toBe("debt");
    expect(getTabFromSearch("?tab=unknown")).toBe("loan");
    expect(getTabFromSearch("")).toBe("loan");
  });

  it("parses tab from pathname (§10.52)", () => {
    expect(getTabFromPathname("/", "/")).toBe("loan");
    expect(getTabFromPathname("/debt", "/")).toBe("debt");
    expect(getTabFromPathname("/retirement", "/")).toBe("retirement");
    expect(getTabFromPathname("/FinancialPlanner/", "/FinancialPlanner")).toBe("loan");
    expect(getTabFromPathname("/FinancialPlanner/debt", "/FinancialPlanner")).toBe("debt");
    expect(getTabFromPathname("/unknown", "/")).toBe("loan");
  });

  it("resolves tab from location pathname before legacy query", () => {
    expect(getTabFromLocation({ pathname: "/debt", search: "" })).toBe("debt");
    expect(getTabFromLocation({ pathname: "/", search: "?tab=retirement" })).toBe("retirement");
  });

  it("builds path-slug tab page URLs (§10.52)", () => {
    expect(tabPageUrl("loan", "https://example.com/app")).toBe("https://example.com/app/");
    expect(tabPageUrl("debt", "https://example.com/app")).toBe("https://example.com/app/debt");
    expect(tabPathname("budget", "/FinancialPlanner")).toBe("/FinancialPlanner/budget");
  });

  it("canonical, sitemap, and build shells share one URL per tab (§10.59)", () => {
    const site = "https://eswarkrishna.github.io/FinancialPlanner";
    const routerBase = "/FinancialPlanner";
    const sitemap = buildSitemapXml(site);

    for (const tab of PLANNER_TABS) {
      const canonical = tabPageUrl(tab.id, site);
      expect(sitemap).toContain(`<loc>${canonical}</loc>`);
      expect(canonical).not.toContain("/FinancialPlanner/FinancialPlanner");

      const shell = buildIndexHtmlReplacements(site, {
        tabId: tab.id,
        routerBase,
      });
      expect(shell.__SEO_CANONICAL__).toBe(canonical);
    }

    expect(tabPageUrl("debt", site)).toBe(
      "https://eswarkrishna.github.io/FinancialPlanner/debt",
    );
  });

  it("lists non-home route slugs for build shells (§10.54)", () => {
    expect(SEO_ROUTE_SLUGS).toEqual([
      "debt",
      "retirement",
      "strategies",
      "strategic",
      "budget",
    ]);
  });

  it("builds noscript fallback with sibling links (§10.55)", () => {
    const html = buildNoscriptHtml("debt", "/");
    expect(html).toContain("<noscript>");
    expect(html).toMatch(/Debt Avalanche/i);
    expect(html).toContain('href="/retirement"');
    expect(html).toContain("Enable JavaScript");
  });

  it("builds page title, heading, and description", () => {
    expect(pageTitle("loan")).toBe("Loan EMI Calculator with Prepayment | FinancialPlanner");
    expect(pageHeading("loan")).toBe("Loan EMI Calculator with Prepayment");
    expect(pageHeading("debt")).toBe("Debt Avalanche vs Snowball Calculator");
    expect(pageDescription("retirement")).toMatch(/retirement corpus/i);
  });

  it("keyword-first titles are unique and ≤ 70 chars (§10.45)", () => {
    const titles = PLANNER_TABS.map((tab) => pageTitle(tab.id));
    expect(new Set(titles).size).toBe(PLANNER_TABS.length);
    for (const title of titles) {
      expect(title.length).toBeLessThanOrEqual(70);
      expect(title.endsWith("| FinancialPlanner")).toBe(true);
      expect(title.startsWith("FinancialPlanner")).toBe(false);
    }
  });

  it("descriptions are unique and 120–160 chars (§10.46)", () => {
    const descriptions = PLANNER_TABS.map((tab) => tab.description);
    expect(new Set(descriptions).size).toBe(PLANNER_TABS.length);
    for (const description of descriptions) {
      expect(description.length).toBeGreaterThanOrEqual(120);
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });

  it("writes robots.txt and sitemap.xml with path URLs", () => {
    const site = "https://example.com/app";
    expect(buildRobotsTxt(site)).toContain("Sitemap: https://example.com/app/sitemap.xml");
    expect(buildSitemapXml(site)).toContain("<loc>https://example.com/app/</loc>");
    expect(buildSitemapXml(site)).toContain("<loc>https://example.com/app/debt</loc>");
    expect(buildSitemapXml(site)).not.toContain("?tab=");
  });

  it("adds sitemap lastmod from build date, omits when unavailable (§10.47)", () => {
    const site = "https://example.com/app";
    expect(buildSitemapXml(site, "2026-07-10T12:34:56+05:30")).toContain(
      "<lastmod>2026-07-10</lastmod>",
    );
    expect(buildSitemapXml(site)).not.toContain("<lastmod>");
    expect(buildSitemapXml(site, "")).not.toContain("<lastmod>");
  });

  it("builds WebApplication JSON-LD with feature list and publisher (§10.47)", () => {
    const jsonLd = buildWebApplicationJsonLd("https://example.com/app", {
      tabId: "debt",
      dateModified: "2026-07-10T12:34:56+05:30",
    });
    expect(jsonLd["@type"]).toBe("WebApplication");
    expect(jsonLd.url).toBe("https://example.com/app/debt");
    expect(jsonLd.isAccessibleForFree).toBe(true);
    expect(jsonLd.featureList).toHaveLength(PLANNER_TABS.length);
    expect(jsonLd.dateModified).toBe("2026-07-10T12:34:56+05:30");
    expect((jsonLd.publisher as { sameAs: string[] }).sameAs).toContain(
      "https://github.com/eswarkrishna/FinancialPlanner",
    );
  });

  it("omits dateModified when build metadata is unavailable", () => {
    const jsonLd = buildWebApplicationJsonLd("https://example.com/app", { dateModified: "" });
    expect(jsonLd).not.toHaveProperty("dateModified");
  });

  it("builds Home → tab breadcrumb, none on loan tab (§10.47)", () => {
    const breadcrumb = buildBreadcrumbJsonLd("budget", "https://example.com/app");
    expect(breadcrumb?.["@type"]).toBe("BreadcrumbList");
    const items = breadcrumb?.itemListElement as Array<{ name: string; item: string }>;
    expect(items[0]).toMatchObject({ name: "Home", item: "https://example.com/app/" });
    expect(items[1]).toMatchObject({
      name: "Budget",
      item: "https://example.com/app/budget",
    });

    expect(buildBreadcrumbJsonLd("loan", "https://example.com/app")).toBeNull();
  });

  it("bundles structured data per tab", () => {
    expect(buildStructuredData("https://example.com/app", { tabId: "loan" })).toHaveLength(1);
    expect(buildStructuredData("https://example.com/app", { tabId: "debt" })).toHaveLength(2);
  });

  it("provides index.html replacement tokens including noscript", () => {
    const replacements = buildIndexHtmlReplacements("https://example.com/app", {
      tabId: "loan",
      routerBase: "/",
    });
    expect(replacements.__SEO_CANONICAL__).toBe("https://example.com/app/");
    expect(replacements.__SEO_JSON_LD__).toContain("WebApplication");
    expect(replacements.__SEO_JSON_LD__).toContain("featureList");
    expect(replacements.__SEO_TITLE__).toBe(
      "Loan EMI Calculator with Prepayment | FinancialPlanner",
    );
    expect(replacements.__SEO_NOSCRIPT__).toContain("<noscript>");
  });

  describe("browser URL helpers", () => {
    beforeEach(() => {
      window.history.replaceState({}, "", "/");
    });

    it("updates path slug in the URL", () => {
      setTabInUrl("debt");
      expect(window.location.pathname).toBe("/debt");
      expect(window.location.search).toBe("");

      setTabInUrl("loan");
      expect(window.location.pathname).toBe("/");
    });

    it("redirects legacy ?tab= query to path slug (§10.53)", () => {
      window.history.replaceState({}, "", "/?tab=debt&utm_source=test");
      const tabId = redirectLegacyTabQuery();
      expect(tabId).toBe("debt");
      expect(window.location.pathname).toBe("/debt");
      expect(window.location.search).toBe("?utm_source=test");
    });

    it("pushes tab history entries when requested", () => {
      const pushSpy = vi.spyOn(window.history, "pushState");
      const replaceSpy = vi.spyOn(window.history, "replaceState");

      setTabInUrl("debt", { push: true });
      expect(pushSpy).toHaveBeenCalled();
      expect(replaceSpy).not.toHaveBeenCalled();

      setTabInUrl("retirement");
      expect(replaceSpy).toHaveBeenCalled();
    });

    it("updates document SEO tags for a tab", () => {
      updatePageSeo("strategies", "https://example.com/app");

      expect(document.title).toBe(
        "Loan Repayment Strategy Comparison | FinancialPlanner",
      );
      expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toMatch(
        /equity blend/i,
      );
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
        "https://example.com/app/strategies",
      );
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
        "https://example.com/app/strategies",
      );
    });

    it("injects JSON-LD with breadcrumb on tab change (§10.47)", () => {
      updatePageSeo("debt", "https://example.com/app");

      const script = document.head.querySelector("script#seo-structured-data");
      expect(script?.getAttribute("type")).toBe("application/ld+json");
      const payload = JSON.parse(script?.textContent ?? "[]") as Array<
        Record<string, unknown>
      >;
      expect(payload).toHaveLength(2);
      expect(payload[0]?.["@type"]).toBe("WebApplication");
      expect(payload[1]?.["@type"]).toBe("BreadcrumbList");

      updatePageSeo("loan", "https://example.com/app");
      const loanPayload = JSON.parse(
        document.head.querySelector("script#seo-structured-data")?.textContent ?? "{}",
      ) as Record<string, unknown>;
      expect(loanPayload["@type"]).toBe("WebApplication");
    });
  });
});
