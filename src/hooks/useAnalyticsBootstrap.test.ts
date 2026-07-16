import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_CONSENT_KEY } from "../lib/analytics/consent";
import { isAnalyticsInitialized, resetAnalyticsForTests } from "../lib/analytics";
import { useAnalyticsBootstrap } from "./useAnalyticsBootstrap";

describe("useAnalyticsBootstrap (§5.1.2)", () => {
  afterEach(() => {
    resetAnalyticsForTests();
    vi.unstubAllEnvs();
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("does not init when measurement ID is unset", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
    const { result } = renderHook(() => useAnalyticsBootstrap("IN"));
    expect(result.current.gaEnabled).toBe(false);
    expect(result.current.analyticsActive).toBe(false);
    expect(isAnalyticsInitialized()).toBe(false);
  });

  it("shows consent banner and waits for accept before init (§10.23)", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
    const { result } = renderHook(() => useAnalyticsBootstrap("IN"));
    expect(result.current.gaEnabled).toBe(true);
    expect(result.current.showAnalyticsConsent).toBe(true);
    expect(result.current.analyticsActive).toBe(false);
    expect(isAnalyticsInitialized()).toBe(false);

    act(() => {
      result.current.acceptAnalytics();
    });

    expect(result.current.showAnalyticsConsent).toBe(false);
    expect(result.current.analyticsActive).toBe(true);
    expect(isAnalyticsInitialized()).toBe(true);
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe("accept");
  });

  it("does not init analytics after reject", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
    const { result } = renderHook(() => useAnalyticsBootstrap("IN"));

    act(() => {
      result.current.rejectAnalytics();
    });

    expect(result.current.analyticsActive).toBe(false);
    expect(isAnalyticsInitialized()).toBe(false);
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe("reject");
  });
});
