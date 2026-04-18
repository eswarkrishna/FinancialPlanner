import { describe, expect, it } from "vitest";
import {
  computeGoldenScenarios,
  type GoldenSnapshot,
} from "../test/fixtures/goldens/buildGoldens";
import baseGolden from "../test/fixtures/goldens/BASE.json";
import prepayTenureGolden from "../test/fixtures/goldens/PREPAY_CASH_25L_TENURE.json";
import uePfToLoanGolden from "../test/fixtures/goldens/UE_PF_TO_LOAN.json";

describe("golden scenario snapshots (SPEC §10)", () => {
  it("matches BASE golden fixture", () => {
    const computed = computeGoldenScenarios();
    expect(computed.BASE).toEqual(baseGolden as GoldenSnapshot);
  });

  it("matches PREPAY_CASH_25L_TENURE golden fixture", () => {
    const computed = computeGoldenScenarios();
    expect(computed.PREPAY_CASH_25L_TENURE).toEqual(
      prepayTenureGolden as GoldenSnapshot,
    );
  });

  it("matches UE_PF_TO_LOAN golden fixture", () => {
    const computed = computeGoldenScenarios();
    expect(computed.UE_PF_TO_LOAN).toEqual(uePfToLoanGolden as GoldenSnapshot);
  });
});
