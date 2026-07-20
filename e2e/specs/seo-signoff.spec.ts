import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import { getBaseUrl } from "../helpers/env";
import { gotoApp, TAB_IDS, type PlannerTabId } from "../helpers/page";

const SEO_H1: Record<PlannerTabId, string> = {
  loan: "Loan EMI Calculator with Prepayment",
  debt: "Debt Avalanche vs Snowball Calculator",
  retirement: "Retirement Corpus & SIP Calculator",
  strategies: "Loan Repayment Strategy Comparison",
  strategic: "Loan Payoff Game Theory Explorer",
  budget: "Budget Planner with 50/30/20 Rule",
};

const BRAND_SUFFIX = " | FinancialPlanner";

function pathForTab(tabId: PlannerTabId): string {
  return tabId === "loan" ? "/" : `/${tabId}/`;
}

async function readJsonLd(page: import("puppeteer").Page): Promise<unknown> {
  return page.evaluate(() => {
    const script = document.getElementById("seo-structured-data");
    if (!script?.textContent) return null;
    return JSON.parse(script.textContent);
  });
}

function entitiesFromJsonLd(payload: unknown): Array<Record<string, unknown>> {
  if (payload == null) return [];
  return Array.isArray(payload) ? payload : [payload as Record<string, unknown>];
}

describe("SEO sign-off (§10.52–58, Phase 12.2)", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
  });

  afterEach(async () => {
    await session.close();
  });

  for (const tabId of TAB_IDS) {
    it(`path ${pathForTab(tabId)} loads tab, title, h1, and JSON-LD`, async () => {
      await gotoApp(session.page, tabId);

      const expectedTitle = `${SEO_H1[tabId]}${BRAND_SUFFIX}`;
      assert.equal(await session.page.title(), expectedTitle);

      const h1 = await session.page.$eval("h1", (element) => element.textContent?.trim() ?? "");
      assert.equal(h1, SEO_H1[tabId]);

      const activeTab = await session.page.$eval(
        '[role="tab"][aria-selected="true"]',
        (element) => element.textContent?.trim() ?? "",
      );
      assert.ok(activeTab.length > 0);

      const jsonLd = await readJsonLd(session.page);
      const entities = entitiesFromJsonLd(jsonLd);
      const webApp = entities.find((entry) => entry["@type"] === "WebApplication");
      assert.ok(webApp, "expected WebApplication JSON-LD");
      assert.equal(webApp?.applicationCategory, "FinanceApplication");

      if (tabId === "loan") {
        assert.equal(
          entities.some((entry) => entry["@type"] === "BreadcrumbList"),
          false,
        );
      } else {
        const breadcrumb = entities.find((entry) => entry["@type"] === "BreadcrumbList");
        assert.ok(breadcrumb, "expected BreadcrumbList JSON-LD on sub-tab");
      }

      const canonical = await session.page.$eval('link[rel="canonical"]', (element) =>
        element.getAttribute("href"),
      );
      assert.ok(canonical, "expected canonical link");
      assert.ok(!canonical.includes("/FinancialPlanner/FinancialPlanner"));
      if (tabId === "loan") {
        assert.match(canonical, /\/(?:FinancialPlanner\/)?$/);
      } else {
        assert.ok(canonical.endsWith(`/${tabId}`), `canonical should end with /${tabId}`);
      }

      const previewPath = pathForTab(tabId);
      const previewUrl = `${getBaseUrl()}${previewPath === "/" ? "/" : previewPath}`;
      const previewResponse = await fetch(previewUrl);
      assert.equal(
        previewResponse.status,
        200,
        `preview route should return HTTP 200: ${previewUrl}`,
      );
    });
  }

  for (const tabId of ["loan", "debt", "budget"] as const) {
    it(`noscript fallback is visible with JavaScript disabled (${tabId})`, async () => {
      const base = getBaseUrl();
      const url = `${base}${pathForTab(tabId)}`;
      await session.page.setJavaScriptEnabled(false);
      await session.page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });

      const noscriptText = await session.page.evaluate(() => {
        const block = document.querySelector("noscript");
        return block?.textContent?.trim() ?? "";
      });
      assert.ok(noscriptText.length > 40, "noscript block should contain fallback copy");
      assert.match(noscriptText, /Other calculators|Enable JavaScript/i);
      assert.match(noscriptText, /calculator|planner|budget|debt|loan/i);

      await session.page.setJavaScriptEnabled(true);
    });
  }
});
