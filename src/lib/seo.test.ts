import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  buildBreadcrumbJsonLd,
  buildIndexHtmlReplacements,
  buildRobotsTxt,
  buildSitemapXml,
  buildStructuredData,
  buildWebApplicationJsonLd,
  getTabFromSearch,
  pageDescription,
  pageTitle,
  PLANNER_TABS,
  resolveSiteUrl,
  setTabInUrl,
  tabPageUrl,
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

  it("parses tab query param", () => {
    expect(getTabFromSearch("?tab=debt")).toBe("debt");
    expect(getTabFromSearch("?tab=unknown")).toBe("loan");
    expect(getTabFromSearch("")).toBe("loan");
  });

  it("builds tab page URLs", () => {
    expect(tabPageUrl("loan", "https://example.com/app")).toBe("https://example.com/app/");
    expect(tabPageUrl("debt", "https://example.com/app")).toBe(
      "https://example.com/app/?tab=debt",
    );
  });

  it("builds page title and description", () => {
    expect(pageTitle("loan")).toBe("Loan EMI Calculator with Prepayment | FinancialPlanner");
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

  it("writes robots.txt and sitemap.xml", () => {
    const site = "https://example.com/app";
    expect(buildRobotsTxt(site)).toContain("Sitemap: https://example.com/app/sitemap.xml");
    expect(buildSitemapXml(site)).toContain("<loc>https://example.com/app/</loc>");
    expect(buildSitemapXml(site)).toContain("<loc>https://example.com/app/?tab=debt</loc>");
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
    expect(jsonLd.url).toBe("https://example.com/app/?tab=debt");
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
      item: "https://example.com/app/?tab=budget",
    });

    expect(buildBreadcrumbJsonLd("loan", "https://example.com/app")).toBeNull();
  });

  it("bundles structured data per tab", () => {
    expect(buildStructuredData("https://example.com/app", { tabId: "loan" })).toHaveLength(1);
    expect(buildStructuredData("https://example.com/app", { tabId: "debt" })).toHaveLength(2);
  });

  it("provides index.html replacement tokens", () => {
    const replacements = buildIndexHtmlReplacements("https://example.com/app");
    expect(replacements.__SEO_CANONICAL__).toBe("https://example.com/app/");
    expect(replacements.__SEO_JSON_LD__).toContain("WebApplication");
    expect(replacements.__SEO_JSON_LD__).toContain("featureList");
    expect(replacements.__SEO_TITLE__).toBe(
      "Loan EMI Calculator with Prepayment | FinancialPlanner",
    );
  });

  describe("browser URL helpers", () => {
    beforeEach(() => {
      window.history.replaceState({}, "", "/");
    });

    it("updates tab query param in the URL", () => {
      setTabInUrl("debt");
      expect(window.location.search).toBe("?tab=debt");

      setTabInUrl("loan");
      expect(window.location.search).toBe("");
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
        "https://example.com/app/?tab=strategies",
      );
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
        "https://example.com/app/?tab=strategies",
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
