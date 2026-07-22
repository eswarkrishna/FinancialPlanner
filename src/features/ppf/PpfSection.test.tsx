import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LOCALE_STORAGE_KEY } from "../../lib/locale/types";
import { renderWithLocale } from "../../test/renderWithLocale";
import { PpfSection } from "./PpfSection";

describe("PpfSection (§4.17)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows methodology trust note and reference maturity KPIs", () => {
    renderWithLocale(<PpfSection />);
    expect(screen.getByText(/Methodology:/)).toBeInTheDocument();
    expect(screen.getByText("Maturity value")).toBeInTheDocument();
    expect(screen.getByText("PPF maturity calculator")).toBeInTheDocument();
  });

  it("shows India disclaimer for US locale", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "US");
    renderWithLocale(<PpfSection />);
    expect(screen.getByText("India-specific instrument")).toBeInTheDocument();
  });
});
