import { describe, expect, it } from "vitest";
import {
  computeUsGoldenScenarios,
  type UsGoldenScenarioMap,
} from "../test/fixtures/goldens-us/buildGoldensUs";
import baseGolden from "../test/fixtures/goldens-us/BASE.json";
import prepayTenureGolden from "../test/fixtures/goldens-us/PREPAY_CASH_50K_TENURE.json";
import jl401kGolden from "../test/fixtures/goldens-us/JL_401K_TO_LOAN.json";
import type { GoldenSnapshot } from "../test/fixtures/goldens/buildGoldens";

describe("US golden scenario snapshots (SPEC-US §10)", () => {
  it("matches BASE golden fixture", () => {
    const computed = computeUsGoldenScenarios();
    expect(computed.BASE).toEqual(baseGolden as GoldenSnapshot);
  });

  it("matches PREPAY_CASH_50K_TENURE golden fixture", () => {
    const computed = computeUsGoldenScenarios();
    expect(computed.PREPAY_CASH_50K_TENURE).toEqual(
      prepayTenureGolden as GoldenSnapshot,
    );
  });

  it("matches JL_401K_TO_LOAN golden fixture", () => {
    const computed = computeUsGoldenScenarios();
    expect(computed.JL_401K_TO_LOAN).toEqual(jl401kGolden as GoldenSnapshot);
  });

  it("JL_401K_TO_LOAN applies 50/50 tranches at months 1 and 12 with penalties", () => {
    const computed = computeUsGoldenScenarios() as UsGoldenScenarioMap;
    expect(computed.JL_401K_TO_LOAN.totals.total_prepayments_inr).toBe(80_000);
    expect(computed.JL_401K_TO_LOAN.first_row.prepayment_inr).toBe(40_000);
    expect(computed.JL_401K_TO_LOAN.row_12?.prepayment_inr).toBe(40_000);
    expect(computed.JL_401K_TO_LOAN.totals.payoff_month).toBe(0);
  });
});
