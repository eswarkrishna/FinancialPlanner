import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithLocale } from "../../test/renderWithLocale";
import { LumpsumSection } from "./LumpsumSection";

describe("LumpsumSection (§4.21)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows methodology trust note and reference KPIs", () => {
    renderWithLocale(<LumpsumSection />);
    expect(screen.getByText(/Methodology:/)).toBeInTheDocument();
    expect(screen.getByText("Future value")).toBeInTheDocument();
    expect(screen.getByText("Lumpsum calculator")).toBeInTheDocument();
    expect(screen.getByText("Balance growth")).toBeInTheDocument();
  });
});
