import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  buildIndexHtmlReplacements,
  buildRobotsTxt,
  buildSitemapXml,
  getTabFromSearch,
  pageDescription,
  pageTitle,
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
    expect(pageTitle("Loan")).toBe("FinancialPlanner — Loan");
    expect(pageDescription("retirement")).toMatch(/retirement corpus/i);
  });

  it("writes robots.txt and sitemap.xml", () => {
    const site = "https://example.com/app";
    expect(buildRobotsTxt(site)).toContain("Sitemap: https://example.com/app/sitemap.xml");
    expect(buildSitemapXml(site)).toContain("<loc>https://example.com/app/</loc>");
    expect(buildSitemapXml(site)).toContain("<loc>https://example.com/app/?tab=debt</loc>");
  });

  it("provides index.html replacement tokens", () => {
    const replacements = buildIndexHtmlReplacements("https://example.com/app");
    expect(replacements.__SEO_CANONICAL__).toBe("https://example.com/app/");
    expect(replacements.__SEO_JSON_LD__).toContain("WebApplication");
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

    it("updates document SEO tags for a tab", () => {
      updatePageSeo("strategies", "https://example.com/app");

      expect(document.title).toBe("FinancialPlanner — Strategies");
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
  });
});
