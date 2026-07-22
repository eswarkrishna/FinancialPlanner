import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LOCALE_STORAGE_KEY } from "../../lib/locale/types";
import { renderWithLocale } from "../../test/renderWithLocale";
import { GratuitySection } from "./GratuitySection";

describe("GratuitySection (§4.20)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows methodology trust note and reference KPIs", () => {
    renderWithLocale(<GratuitySection />);
    expect(screen.getByText(/Methodology:/)).toBeInTheDocument();
    expect(screen.getByText("Gratuity payable")).toBeInTheDocument();
    expect(screen.getByText("Gratuity calculator")).toBeInTheDocument();
  });

  it("shows India disclaimer for US locale", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "US");
    renderWithLocale(<GratuitySection />);
    expect(screen.getByText("India-specific benefit")).toBeInTheDocument();
  });
});
