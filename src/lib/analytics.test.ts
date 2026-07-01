import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildClickParams,
  initAnalytics,
  initClickTracking,
  isAnalyticsEnabled,
  resetAnalyticsForTests,
  setAnalyticsLocale,
  trackClick,
  trackEvent,
  trackHomePageView,
  trackJobLossMode,
  trackLoadReferenceScenario,
  trackLocaleSwitch,
  trackPageView,
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
    expect(() => trackClick(document.createElement("button"))).not.toThrow();
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

    it("builds click params without form values", () => {
      const button = document.createElement("button");
      button.id = "tab-loan";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-label", "Loan");
      button.textContent = "Loan";

      expect(buildClickParams(button, "/tab/loan")).toEqual({
        element_tag: "button",
        element_id: "tab-loan",
        element_role: "tab",
        element_label: "Loan",
        element_text: "Loan",
        page_path: "/tab/loan",
      });
    });

    it("tracks clicks via gtag", () => {
      const link = document.createElement("a");
      link.href = "https://example.com";
      link.textContent = "Example";

      trackClick(link, "/");

      expect(gtagSpy).toHaveBeenCalledWith("event", "click", {
        element_tag: "a",
        link_url: "https://example.com/",
        element_text: "Example",
        page_path: "/",
      });
    });

    it("records delegated document clicks once", () => {
      initClickTracking();
      initClickTracking();

      const button = document.createElement("button");
      button.textContent = "Go";
      document.body.appendChild(button);
      button.click();

      const clickEvents = gtagSpy.mock.calls.filter(
        (call) => call[0] === "event" && call[1] === "click",
      );

      expect(clickEvents).toHaveLength(1);
      expect(clickEvents[0]?.[2]).toMatchObject({
        element_tag: "button",
        element_text: "Go",
      });
    });

    it("sets user_properties locale via setAnalyticsLocale", () => {
      setAnalyticsLocale("US");

      expect(gtagSpy).toHaveBeenCalledWith("set", "user_properties", {
        locale: "US",
      });
    });

    it("includes locale on page views and events when set", () => {
      setAnalyticsLocale("IN");
      trackHomePageView();
      trackPageView("tab/loan", "FinancialPlanner — Loan");
      trackEvent("custom_event", { foo: "bar" });

      expect(gtagSpy).toHaveBeenCalledWith("event", "page_view", {
        page_path: "/",
        page_title: "FinancialPlanner — Home",
        page_location: expect.any(String),
        locale: "IN",
      });
      expect(gtagSpy).toHaveBeenCalledWith("event", "page_view", {
        page_path: "/tab/loan",
        page_title: "FinancialPlanner — Loan",
        page_location: expect.any(String),
        locale: "IN",
      });
      expect(gtagSpy).toHaveBeenCalledWith("event", "custom_event", {
        foo: "bar",
        locale: "IN",
      });
    });

    it("includes explicit locale param over module state", () => {
      setAnalyticsLocale("IN");
      trackPageView("tab/debt", "Debt", "US");

      expect(gtagSpy).toHaveBeenCalledWith("event", "page_view", {
        page_path: "/tab/debt",
        page_title: "Debt",
        page_location: expect.any(String),
        locale: "US",
      });
    });

    it("includes locale in buildClickParams when set", () => {
      setAnalyticsLocale("US");
      const button = document.createElement("button");
      button.textContent = "Save";

      expect(buildClickParams(button)).toMatchObject({
        element_tag: "button",
        element_text: "Save",
        locale: "US",
      });
    });

    it("tracks locale_switch event", () => {
      trackLocaleSwitch("IN", "US");

      expect(gtagSpy).toHaveBeenCalledWith("event", "locale_switch", {
        from: "IN",
        to: "US",
      });
    });

    it("tracks load_reference_scenario event", () => {
      trackLoadReferenceScenario("IN");

      expect(gtagSpy).toHaveBeenCalledWith("event", "load_reference_scenario", {
        locale: "IN",
      });
    });

    it("tracks job_loss_mode event", () => {
      trackJobLossMode("US", true);

      expect(gtagSpy).toHaveBeenCalledWith("event", "job_loss_mode", {
        locale: "US",
        enabled: true,
      });
    });
  });
});
