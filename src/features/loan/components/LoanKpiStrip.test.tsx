import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoanKpiStrip } from "./LoanKpiStrip";
import type { ComparisonRow } from "../hooks/loanModelTypes";

const baseRow: ComparisonRow = {
  id: "BASE",
  label: "Baseline",
  payoffMonth: 168,
  deltaVsBaseMonths: 0,
  totalInterest: 4_500_000,
  deltaInterestVsBase: 0,
  grossInterestSaved: 0,
  prepaymentFees: 0,
  netSavingsAfterFee: 0,
  totalPaid: 9_500_000,
};

describe("LoanKpiStrip", () => {
  it("shows prepay hint on baseline view", () => {
    render(
      <LoanKpiStrip
        locale="IN"
        scenarioView="BASE"
        comparisonRows={[baseRow]}
        activeWarnings={[]}
        emiLabel="EMI"
        emiValue={45_000}
      />,
    );

    expect(screen.getByText("Add a prepayment to compare")).toBeInTheDocument();
    expect(screen.queryByText("Interest saved vs baseline")).not.toBeInTheDocument();
  });
});
