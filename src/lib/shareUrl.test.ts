import { describe, expect, it } from "vitest";
import { buildFacebookShareUrl, buildShareTabUrl } from "./shareUrl";

describe("shareUrl (§5.1.1)", () => {
  it("buildShareTabUrl appends utm_source and utm_medium without amounts", () => {
    const url = new URL(buildShareTabUrl("debt", { source: "share", medium: "copy" }));
    expect(url.searchParams.get("utm_source")).toBe("share");
    expect(url.searchParams.get("utm_medium")).toBe("copy");
    expect(url.pathname.endsWith("/debt")).toBe(true);
    expect(url.searchParams.has("tab")).toBe(false);
    expect([...url.searchParams.keys()].every((k) => k.startsWith("utm_"))).toBe(true);
  });

  it("buildFacebookShareUrl wraps tab URL in Facebook sharer (§10.20a)", () => {
    const sharer = new URL(buildFacebookShareUrl("loan"));
    expect(sharer.origin + sharer.pathname).toBe(
      "https://www.facebook.com/sharer/sharer.php",
    );
    const shared = new URL(sharer.searchParams.get("u") ?? "");
    expect(shared.searchParams.get("utm_source")).toBe("facebook");
    expect(shared.searchParams.get("utm_medium")).toBe("social");
    expect(shared.searchParams.has("principal")).toBe(false);
    expect(shared.searchParams.has("emi")).toBe(false);
  });
});
