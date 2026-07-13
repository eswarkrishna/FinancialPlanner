import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  initAnalytics,
  isAnalyticsEnabled,
  resetAnalyticsForTests,
  trackFeedbackHelpful,
  trackHomePageView,
  trackLoanExportScheduleCsv,
  trackPageView,
  trackSessionStart,
  trackSessionSummary,
  trackShareLinkCopy,
  trackShareLinkFacebook,
  trackTabSelect,
  trackWebVitals,
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

    it("tracks session_start with landing_tab and locale (§5.1.2)", () => {
      trackSessionStart({ landing_tab: "loan", locale: "IN", utm_source: "test" });

      expect(gtagSpy).toHaveBeenCalledWith("event", "session_start", {
        landing_tab: "loan",
        locale: "IN",
        utm_source: "test",
        page_path: expect.any(String),
      });
    });

    it("tracks share_link_copy with tab_id and locale (§5.1.1)", () => {
      trackShareLinkCopy("debt", "US");

      expect(gtagSpy).toHaveBeenCalledWith("event", "share_link_copy", {
        tab_id: "debt",
        locale: "US",
        page_path: expect.any(String),
      });
    });

    it("tracks share_link_facebook with tab_id and locale (§5.1.1 / §10.20a)", () => {
      trackShareLinkFacebook("strategy", "IN");

      expect(gtagSpy).toHaveBeenCalledWith("event", "share_link_facebook", {
        tab_id: "strategy",
        locale: "IN",
        page_path: expect.any(String),
      });
    });

    it("tracks session_summary on unload (§5.1.2)", () => {
      trackSessionSummary({
        locale: "UK",
        tabs_visited_count: 2,
        had_export: true,
      });

      expect(gtagSpy).toHaveBeenCalledWith("event", "session_summary", {
        locale: "UK",
        tabs_visited_count: 2,
        had_export: "true",
        page_path: expect.any(String),
        transport_type: "beacon",
      });
    });

    it("tracks web_vitals sample (§5.1.2)", () => {
      trackWebVitals({ metric_name: "LCP", metric_value: 1.2, metric_rating: "good" });

      expect(gtagSpy).toHaveBeenCalledWith("event", "web_vitals", {
        metric_name: "LCP",
        metric_value: 1.2,
        metric_rating: "good",
        page_path: expect.any(String),
      });
    });

    it("tracks feedback_helpful (§5.1.2)", () => {
      trackFeedbackHelpful(true, "loan", "IN");

      expect(gtagSpy).toHaveBeenCalledWith("event", "feedback_helpful", {
        tab_id: "loan",
        helpful: "true",
        locale: "IN",
        page_path: expect.any(String),
      });
    });
  });
});
