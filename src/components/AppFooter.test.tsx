import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppFooter } from "./AppFooter";
import { getBuildInfo } from "../lib/buildInfo";

describe("AppFooter", () => {
  it("shows latest push metadata with a link to the commit", () => {
    const info = getBuildInfo();
    expect(info).not.toBeNull();

    render(<AppFooter />);

    expect(screen.getByText(/Latest push:/)).toBeInTheDocument();
    expect(screen.getByRole("time")).toHaveAttribute("dateTime", info!.commitIsoDate);
    const link = screen.getByRole("link", { name: info!.commitShort });
    expect(link).toHaveAttribute(
      "href",
      `https://github.com/${info!.githubRepo}/commit/${info!.commitSha}`,
    );
  });

  it("shows the educational disclaimer and terms", () => {
    render(<AppFooter />);

    expect(
      screen.getByText(/Educational planning only\. EPF withdrawal eligibility/),
    ).toBeInTheDocument();
    expect(screen.getByText("Terms and conditions")).toBeInTheDocument();
  });
});
