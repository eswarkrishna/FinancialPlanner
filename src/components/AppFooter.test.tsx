import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithLocale } from "../test/renderWithLocale";
import { AppFooter } from "./AppFooter";
import { getBuildInfo } from "../lib/buildInfo";

describe("AppFooter", () => {
  it("shows latest push metadata with a link to the commit", () => {
    const info = getBuildInfo();
    expect(info).not.toBeNull();

    renderWithLocale(<AppFooter />);

    expect(screen.getByText(/Latest push:/)).toBeInTheDocument();
    expect(screen.getByRole("time")).toHaveAttribute("dateTime", info!.commitIsoDate);
    const link = screen.getByRole("link", {
      name: `View commit ${info!.commitShort} on GitHub (opens in new tab)`,
    });
    expect(link).toHaveAttribute(
      "href",
      `https://github.com/${info!.githubRepo}/commit/${info!.commitSha}`,
    );
  });

  it("shows the educational disclaimer and terms", () => {
    renderWithLocale(<AppFooter />);

    expect(
      screen.getByText(/Educational planning only\. EPF withdrawal eligibility/),
    ).toBeInTheDocument();
    expect(screen.getByText("Terms and conditions")).toBeInTheDocument();
  });

  it("shows GitHub issues link for feedback", () => {
    const info = getBuildInfo();
    renderWithLocale(<AppFooter />);

    const link = screen.getByRole("link", {
      name: "Report an issue on GitHub (opens in new tab)",
    });
    expect(link).toHaveAttribute(
      "href",
      `https://github.com/${info!.githubRepo}/issues/new`,
    );
    expect(link).toHaveAttribute("target", "_blank");
  });
});
