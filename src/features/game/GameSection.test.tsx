import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameSection } from "./GameSection";

describe("GameSection", () => {
  it("renders payoff matrix for default BL fee game", () => {
    render(<GameSection />);
    expect(
      screen.getByRole("heading", { name: "Strategic scenarios (SPEC §4.13)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Payoff matrix" })).toBeInTheDocument();
    expect(screen.getByText(/10 cells/)).toBeInTheDocument();
  });
});
