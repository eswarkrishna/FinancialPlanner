import { describe, expect, it } from "vitest";
import { PLANNER_TABS, type TabId } from "./seo";
import {
  countWords,
  getRelatedCalculatorLinks,
  getTabExplainer,
  RELATED_CALCULATOR_LINKS,
  TAB_EXPLAINERS,
} from "./tabPageContent";

describe("tabPageContent", () => {
  it("explainers are unique and 100–200 words per tab (§10.58)", () => {
    const texts = PLANNER_TABS.map((tab) => TAB_EXPLAINERS[tab.id]);
    expect(new Set(texts).size).toBe(PLANNER_TABS.length);

    for (const tab of PLANNER_TABS) {
      const words = countWords(getTabExplainer(tab.id));
      expect(words, `${tab.id} explainer word count`).toBeGreaterThanOrEqual(100);
      expect(words, `${tab.id} explainer word count`).toBeLessThanOrEqual(200);
    }
  });

  it("each tab has at least one related calculator link (§10.57)", () => {
    for (const tab of PLANNER_TABS) {
      const links = getRelatedCalculatorLinks(tab.id);
      expect(links.length).toBeGreaterThanOrEqual(1);
      for (const link of links) {
        expect(link.tabId).not.toBe(tab.id);
        expect(link.blurb.length).toBeGreaterThan(10);
      }
    }
  });

  it("related links do not point to the current tab", () => {
    for (const tabId of Object.keys(RELATED_CALCULATOR_LINKS) as TabId[]) {
      for (const link of RELATED_CALCULATOR_LINKS[tabId]) {
        expect(link.tabId).not.toBe(tabId);
      }
    }
  });
});
