import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithLocale } from "../../test/renderWithLocale";
import { RetirementSection } from "./RetirementSection";

describe("RetirementSection", () => {
  it("renders scenarios table and yearly timeline", () => {
    renderWithLocale(<RetirementSection />);

    expect(
      screen.getByRole("heading", { name: "Retirement scenarios" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Retirement yearly corpus timeline (Base)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Post-retirement drawdown (Base)" }),
    ).toBeInTheDocument();
  });

  it("updates yearly timeline when scenario selection changes", () => {
    renderWithLocale(<RetirementSection />);

    fireEvent.change(screen.getByLabelText("Yearly timeline scenario"), {
      target: { value: "optimistic" },
    });

    expect(
      screen.getByRole("heading", {
        name: "Retirement yearly corpus timeline (Optimistic)",
      }),
    ).toBeInTheDocument();
  });
});
