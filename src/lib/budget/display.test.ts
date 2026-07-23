import { describe, expect, it } from "vitest";
import {
  chartViewFactor,
  chartViewLabel,
  savingsRateBand,
  savingsRateBandTone,
  scaleForChartView,
} from "./display";

describe("savingsRateBand (§4.16.5, §10.94)", () => {
  it("maps band boundaries: <10 low, 10–20 medium, ≥20 high", () => {
    expect(savingsRateBand(0)).toBe("low");
    expect(savingsRateBand(9.9)).toBe("low");
    expect(savingsRateBand(10)).toBe("medium");
    expect(savingsRateBand(19.9)).toBe("medium");
    expect(savingsRateBand(20)).toBe("high");
    expect(savingsRateBand(45)).toBe("high");
  });

  it("maps bands to KPI tones", () => {
    expect(savingsRateBandTone("low")).toBe("danger");
    expect(savingsRateBandTone("medium")).toBe("warning");
    expect(savingsRateBandTone("high")).toBe("positive");
  });
});

describe("scaleForChartView (§4.16.5, §10.95)", () => {
  it("keeps monthly amounts unchanged", () => {
    expect(chartViewFactor("monthly")).toBe(1);
    expect(scaleForChartView(95_000, "monthly")).toBe(95_000);
  });

  it("annualises yearly amounts by ×12 with paise rounding", () => {
    expect(chartViewFactor("yearly")).toBe(12);
    expect(scaleForChartView(95_000, "yearly")).toBe(1_140_000);
    expect(scaleForChartView(1_234.567, "yearly")).toBe(14_814.8);
  });

  it("labels views for chart titles", () => {
    expect(chartViewLabel("monthly")).toBe("monthly");
    expect(chartViewLabel("yearly")).toBe("yearly");
  });
});
