import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReleaseNotificationConsent } from "./ReleaseNotificationConsent";
import { RELEASE_CONSENT_LEAD } from "../lib/notifications/constants";

describe("ReleaseNotificationConsent (§4.15)", () => {
  it("offers enable and reject actions", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(<ReleaseNotificationConsent onAccept={onAccept} onReject={onReject} />);

    expect(screen.getByText(RELEASE_CONSENT_LEAD)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /enable notifications/i }));
    await user.click(screen.getByRole("button", { name: /no thanks/i }));

    expect(onAccept).toHaveBeenCalled();
    expect(onReject).toHaveBeenCalled();
  });
});
