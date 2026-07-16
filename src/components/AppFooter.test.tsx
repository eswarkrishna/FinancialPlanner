import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithLocale } from "../test/renderWithLocale";
import { AppFooter } from "./AppFooter";
import { getBuildInfo } from "../lib/buildInfo";

describe("AppFooter", () => {
  it("shows latest push metadata with a link to the commit", () => {
    const info = getBuildInfo();
    expect(info).not.toBeNull();

    renderWithLocale(<AppFooter activeTab="loan" locale="IN" />);

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
    renderWithLocale(<AppFooter activeTab="loan" locale="IN" />);

    expect(
      screen.getByText(/Educational planning only\. EPF withdrawal eligibility/),
    ).toBeInTheDocument();
    expect(screen.getByText("Terms and conditions")).toBeInTheDocument();
  });

  it("shows GitHub issues link for feedback", () => {
    const info = getBuildInfo();
    renderWithLocale(<AppFooter activeTab="loan" locale="IN" />);

    const link = screen.getByRole("link", {
      name: "Report an issue on GitHub (opens in new tab)",
    });
    expect(link).toHaveAttribute(
      "href",
      `https://github.com/${info!.githubRepo}/issues/new`,
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows Share on Facebook next to copy-link (§8)", () => {
    renderWithLocale(<AppFooter activeTab="debt" locale="US" />);

    expect(screen.getByRole("button", { name: "Copy link to this tab" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share on Facebook" })).toBeInTheDocument();
  });

  it("documents localStorage and analytics consent in terms", async () => {
    const user = userEvent.setup();
    renderWithLocale(<AppFooter activeTab="loan" locale="IN" />);

    await user.click(screen.getByText("Terms and conditions"));

    expect(screen.getByText(/Browser storage/i)).toBeInTheDocument();
    expect(screen.getByText(/ask for consent before loading/i)).toBeInTheDocument();
  });
});
