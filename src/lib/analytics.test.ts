import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  initAnalytics,
  isAnalyticsEnabled,
  resetAnalyticsForTests,
  trackHomePageView,
  trackLoanExportScheduleCsv,
  trackPageView,
  trackTabSelect,
} from "./analytics";

describe("analytics", () => {
  afterEach(() => {
    resetAnalyticsForTests();
    vi.unstubAllEnvs();
    document.body.innerHTML = "";
  });

  it("is disabled when VITE_GA_MEASUREMENT_ID is unset", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
    expect(isAnalyticsEnabled()).toBe(false);
    expect(() => trackPageView("tab/loan")).not.toThrow();
  });

  it("does not throw when tracking without init", () => {
    expect(() => trackPageView("tab/loan", "Loan")).not.toThrow();
    expect(() => trackTabSelect("loan")).not.toThrow();
  });

  it("queues bootstrap commands as Arguments objects for gtag.js", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
    initAnalytics();

    const entries = (window.dataLayer ?? []) as Array<IArguments>;
    expect(entries.length).toBeGreaterThanOrEqual(2);
    for (const entry of entries) {
      expect(Array.isArray(entry)).toBe(false);
    }
    expect(entries[0]?.[0]).toBe("js");
    expect(entries[1]?.[0]).toBe("config");
    expect(entries[1]?.[1]).toBe("G-TEST123");
    expect(entries[1]?.[2]).toMatchObject({ send_page_view: false });
  });

  describe("when enabled", () => {
    let gtagSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
      initAnalytics();
      gtagSpy = vi.fn();
      window.gtag = gtagSpy;
    });

    it("tracks home and tab page views via gtag", () => {
      trackHomePageView();
      trackPageView("tab/loan", "FinancialPlanner — Loan");

      expect(gtagSpy).toHaveBeenCalledWith("event", "page_view", {
        page_path: "/",
        page_title: "FinancialPlanner — Home",
        page_location: expect.any(String),
      });
      expect(gtagSpy).toHaveBeenCalledWith("event", "page_view", {
        page_path: "/tab/loan",
        page_title: "FinancialPlanner — Loan",
        page_location: expect.any(String),
      });
    });

    it("tracks tab_select with tab_id and page_path (§5.1)", () => {
      trackTabSelect("loan");

      expect(gtagSpy).toHaveBeenCalledWith("event", "tab_select", {
        tab_id: "loan",
        page_path: expect.any(String),
      });
    });

    it("tracks loan_export_schedule_csv with scenario_view and locale (§5.1)", () => {
      trackLoanExportScheduleCsv("BASE", "IN");

      expect(gtagSpy).toHaveBeenCalledWith("event", "loan_export_schedule_csv", {
        scenario_view: "BASE",
        locale: "IN",
        page_path: expect.any(String),
      });
    });
  });
});
