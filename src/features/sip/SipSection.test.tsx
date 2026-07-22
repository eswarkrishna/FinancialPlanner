import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LOCALE_STORAGE_KEY } from "../../lib/locale/types";
import { renderWithLocale } from "../../test/renderWithLocale";
import { SipSection } from "./SipSection";

describe("SipSection (§4.18)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows methodology trust note and reference maturity KPIs", () => {
    renderWithLocale(<SipSection />);
    expect(screen.getByText(/Methodology:/)).toBeInTheDocument();
    expect(screen.getByText("Maturity value")).toBeInTheDocument();
    expect(screen.getByText("SIP calculator")).toBeInTheDocument();
  });

  it("shows illustrative disclaimer for US locale", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "US");
    renderWithLocale(<SipSection />);
    expect(screen.getByText("Illustrative model")).toBeInTheDocument();
  });
});
