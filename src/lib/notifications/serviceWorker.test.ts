import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRemoteVersion, serviceWorkerUrl, versionJsonUrl } from "./serviceWorker";

describe("serviceWorker helpers (§4.15)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("builds version and service worker URLs from base path", () => {
    expect(versionJsonUrl("/FinancialPlanner/")).toBe("/FinancialPlanner/version.json");
    expect(serviceWorkerUrl("/FinancialPlanner/")).toBe("/FinancialPlanner/sw.js");
  });

  it("parses remote version.json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sha: "remote-sha",
          short: "remote1",
          date: "2026-07-08T00:00:00.000Z",
        }),
      }),
    );

    const manifest = await fetchRemoteVersion("/FinancialPlanner/");
    expect(manifest).toEqual({
      sha: "remote-sha",
      short: "remote1",
      date: "2026-07-08T00:00:00.000Z",
    });
  });

  it("returns null when version.json fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    expect(await fetchRemoteVersion("/")).toBeNull();
  });
});
