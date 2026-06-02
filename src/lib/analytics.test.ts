import { afterEach, describe, expect, it, vi } from "vitest";
import { isAnalyticsEnabled, trackPageView } from "./analytics";

describe("analytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled when VITE_GA_MEASUREMENT_ID is unset", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
    expect(isAnalyticsEnabled()).toBe(false);
    expect(() => trackPageView("tab/loan")).not.toThrow();
  });

  it("does not throw when tracking without init", () => {
    expect(() => trackPageView("tab/loan", "Loan")).not.toThrow();
  });
});
