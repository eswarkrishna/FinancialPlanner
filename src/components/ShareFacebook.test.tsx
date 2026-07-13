import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareFacebook } from "./ShareFacebook";

vi.mock("../lib/analytics", () => ({
  trackShareLinkFacebook: vi.fn(),
}));

import { trackShareLinkFacebook } from "../lib/analytics";

describe("ShareFacebook (§8 / §10.20a)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens Facebook sharer with facebook/social UTMs and tracks the event", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    render(<ShareFacebook tabId="retirement" locale="UK" />);

    fireEvent.click(screen.getByRole("button", { name: "Share on Facebook" }));

    expect(trackShareLinkFacebook).toHaveBeenCalledWith("retirement", "UK");
    expect(openSpy).toHaveBeenCalledTimes(1);
    const href = String(openSpy.mock.calls[0]?.[0] ?? "");
    expect(href).toContain("https://www.facebook.com/sharer/sharer.php");
    const u = new URL(href).searchParams.get("u") ?? "";
    expect(u).toContain("utm_source=facebook");
    expect(u).toContain("utm_medium=social");
    expect(openSpy.mock.calls[0]?.[2]).toContain("noopener");
  });
});
