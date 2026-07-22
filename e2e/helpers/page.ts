import type { Page } from "puppeteer";
import { getBaseUrl } from "./env";

const TAB_IDS = ["loan", "debt", "retirement", "ppf", "sip", "strategies", "strategic", "budget"] as const;
export type PlannerTabId = (typeof TAB_IDS)[number];

/** Canonical path slug per tab (SPEC §8). */
const TAB_PATH_SLUG: Record<PlannerTabId, string> = {
  loan: "",
  debt: "debt",
  retirement: "retirement",
  ppf: "ppf",
  sip: "sip",
  strategies: "payoff-strategies",
  strategic: "what-if-games",
  budget: "budget",
};

export async function dismissConsentBanners(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const dismissed = await page.evaluate(() => {
      let clicked = false;
      for (const button of document.querySelectorAll("button")) {
        const label = button.textContent?.trim();
        if (label === "No thanks") {
          button.click();
          clicked = true;
        }
      }
      return clicked;
    });
    if (!dismissed) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export async function clickAriaLabel(page: Page, label: string): Promise<void> {
  const clicked = await page.evaluate((ariaLabel) => {
    const target = document.querySelector<HTMLElement>(`[aria-label="${ariaLabel}"]`);
    if (!target) return false;
    target.click();
    return true;
  }, label);
  if (!clicked) {
    throw new Error(`Control with aria-label "${label}" was not found`);
  }
}

export async function gotoApp(page: Page, tab: PlannerTabId = "loan"): Promise<void> {
  const base = getBaseUrl();
  const slug = TAB_PATH_SLUG[tab];
  const url = slug ? `${base}/${slug}` : `${base}/`;
  await page.goto(url, { waitUntil: "networkidle0" });
  await dismissConsentBanners(page);
  await page.waitForSelector("h1", { timeout: 10_000 });
}

const TAB_LABELS: Record<PlannerTabId, string> = {
  loan: "Loan",
  debt: "Multi-debt",
  retirement: "Retirement",
  ppf: "PPF",
  sip: "SIP",
  strategies: "Payoff strategies",
  strategic: "What-if games",
  budget: "Budget",
};

export async function clickTab(page: Page, tabId: PlannerTabId): Promise<void> {
  const label = TAB_LABELS[tabId];
  const clicked = await page.evaluate(
    (id, tabLabel) => {
      const sidebar = document.querySelector(".app-sidebar");
      const sidebarVisible =
        sidebar != null && window.getComputedStyle(sidebar).display !== "none";
      if (sidebarVisible) {
        for (const button of document.querySelectorAll(".app-sidebar-link")) {
          if (button.textContent?.trim() === tabLabel) {
            (button as HTMLButtonElement).click();
            return true;
          }
        }
      }

      const tab = document.getElementById(`tab-${id}`);
      if (tab) {
        tab.click();
        return true;
      }
      return false;
    },
    tabId,
    label,
  );

  if (!clicked) {
    throw new Error(`Could not activate tab ${tabId}`);
  }

  await page.waitForFunction(
    (id) => {
      const panel = document.getElementById(`panel-${id}`);
      return panel != null && !panel.hasAttribute("hidden");
    },
    { timeout: 5_000 },
    tabId,
  );
}

export async function clickButtonByLabel(page: Page, label: string): Promise<void> {
  const clicked = await page.evaluate((text) => {
    for (const button of document.querySelectorAll("button")) {
      if (button.textContent?.includes(text)) {
        button.click();
        return true;
      }
    }
    return false;
  }, label);
  if (!clicked) {
    throw new Error(`Button containing "${label}" was not found`);
  }
}

export async function headingText(page: Page, name: string): Promise<string | null> {
  return page.evaluate((heading) => {
    for (const element of document.querySelectorAll("h2")) {
      if (element.textContent?.trim() === heading) {
        return element.textContent.trim();
      }
    }
    return null;
  }, name);
}

export async function waitForHeading(page: Page, name: string): Promise<void> {
  await page.waitForFunction(
    (heading) => {
      for (const element of document.querySelectorAll("h2")) {
        if (element.textContent?.trim() === heading) {
          return true;
        }
      }
      return false;
    },
    { timeout: 10_000 },
    name,
  );
}

export async function setLabeledInput(page: Page, labelText: string, value: string): Promise<void> {
  const updated = await page.evaluate(
    (label, nextValue) => {
      for (const element of document.querySelectorAll("label")) {
        if (!element.textContent?.includes(label)) continue;

        let input =
          element.querySelector("input") ??
          (() => {
            const htmlFor = element.getAttribute("for");
            return htmlFor ? document.getElementById(htmlFor) : null;
          })();

        if (!(input instanceof HTMLInputElement)) continue;

        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(input, nextValue);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    },
    labelText,
    value,
  );
  if (!updated) {
    throw new Error(`Input for label containing "${labelText}" was not found`);
  }
}

export async function getComparisonPayoffMonth(page: Page): Promise<string> {
  await waitForHeading(page, "Loan scenario comparison");
  const month = await page.evaluate(() => {
    const section = Array.from(document.querySelectorAll("h2"))
      .find((heading) => heading.textContent?.trim() === "Loan scenario comparison")
      ?.closest("section");
    const firstRow = section?.querySelector("tbody tr");
    const cells = firstRow ? Array.from(firstRow.querySelectorAll("td")) : [];
    return cells[1]?.textContent?.trim() ?? "";
  });
  if (!month) {
    throw new Error("Could not read payoff month from comparison table");
  }
  return month;
}

export { TAB_IDS, TAB_PATH_SLUG };
