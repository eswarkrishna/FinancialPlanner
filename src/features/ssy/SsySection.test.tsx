import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LOCALE_STORAGE_KEY } from "../../lib/locale/types";
import { renderWithLocale } from "../../test/renderWithLocale";
import { SsySection } from "./SsySection";

describe("SsySection (§4.19)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows methodology trust note and reference maturity KPIs", () => {
    renderWithLocale(<SsySection />);
    expect(screen.getByText(/Methodology:/)).toBeInTheDocument();
    expect(screen.getByText("Maturity at age 21")).toBeInTheDocument();
    expect(screen.getByText("SSY maturity calculator")).toBeInTheDocument();
  });

  it("shows India disclaimer for US locale", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "US");
    renderWithLocale(<SsySection />);
    expect(screen.getByText("India-specific instrument")).toBeInTheDocument();
  });
});
