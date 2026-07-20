import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithLocale } from "../../test/renderWithLocale";
import { GameSection } from "./GameSection";

describe("GameSection", () => {
  it("renders legend and payoff matrix for default BL fee game", () => {
    renderWithLocale(<GameSection />);
    expect(screen.getByRole("heading", { name: "Strategic scenarios" })).toBeInTheDocument();
    expect(
      screen.getByText(/Legend — what the abbreviations mean/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/B_PREPAY_25/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Payoff matrix" })).toBeInTheDocument();
    expect(screen.getByText(/10 payoff combinations/)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /plain English/i })).toBeInTheDocument();
  });
});
