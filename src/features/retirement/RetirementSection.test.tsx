import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RetirementSection } from "./RetirementSection";

describe("RetirementSection", () => {
  it("renders scenarios table and yearly timeline", () => {
    render(<RetirementSection />);

    expect(
      screen.getByRole("heading", { name: "Retirement scenarios" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Retirement yearly corpus timeline (Base)",
      }),
    ).toBeInTheDocument();
  });

  it("updates yearly timeline when scenario selection changes", () => {
    render(<RetirementSection />);

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
