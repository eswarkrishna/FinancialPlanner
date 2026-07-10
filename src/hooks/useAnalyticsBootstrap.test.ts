import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isAnalyticsInitialized, resetAnalyticsForTests } from "../lib/analytics";
import { useAnalyticsBootstrap } from "./useAnalyticsBootstrap";

describe("useAnalyticsBootstrap (§5.1.2)", () => {
  afterEach(() => {
    resetAnalyticsForTests();
    vi.unstubAllEnvs();
    document.body.innerHTML = "";
  });

  it("does not init when measurement ID is unset", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
    const { result } = renderHook(() => useAnalyticsBootstrap("IN"));
    expect(result.current.gaEnabled).toBe(false);
    expect(isAnalyticsInitialized()).toBe(false);
  });

  it("inits analytics on load without consent (§10.23)", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
    const { result } = renderHook(() => useAnalyticsBootstrap("IN"));
    expect(result.current.gaEnabled).toBe(true);
    expect(isAnalyticsInitialized()).toBe(true);
    expect(document.querySelector('[aria-label="Analytics consent"]')).toBeNull();
  });
});
