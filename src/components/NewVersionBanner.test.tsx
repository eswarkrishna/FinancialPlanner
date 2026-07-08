import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewVersionBanner } from "./NewVersionBanner";

describe("NewVersionBanner (§4.15)", () => {
  it("shows reload and dismiss controls", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    const onDismiss = vi.fn();

    render(
      <NewVersionBanner shortCommit="abc1234" onReload={onReload} onDismiss={onDismiss} />,
    );

    expect(screen.getByText(/A new version is available/i)).toBeInTheDocument();
    expect(screen.getByText(/abc1234/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^reload$/i }));
    await user.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(onReload).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });
});
