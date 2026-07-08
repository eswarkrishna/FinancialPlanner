import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acknowledgeVersionUpdate,
  checkLoadedBuildForUpdate,
  pollRemoteVersionForUpdate,
} from "./releaseNotifications";
import { LAST_SEEN_COMMIT_SHA_KEY, AWAITING_RELOAD_SHA_KEY } from "./constants";
import { fetchRemoteVersion } from "./serviceWorker";
import { getBuildInfo } from "../buildInfo";

vi.mock("./serviceWorker", () => ({
  fetchRemoteVersion: vi.fn(),
  pingServiceWorkerVersionCheck: vi.fn(),
  registerReleaseServiceWorker: vi.fn(),
}));

vi.mock("../buildInfo", () => ({
  getBuildInfo: vi.fn(),
}));

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe("releaseNotifications (§4.15)", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns remote sha when polling detects a newer deploy", async () => {
    const storage = memoryStorage();
    storage.setItem(LAST_SEEN_COMMIT_SHA_KEY, "old-sha");

    vi.mocked(getBuildInfo).mockReturnValue({
      commitSha: "old-sha",
      commitShort: "old1234",
      commitIsoDate: "2026-07-01T00:00:00.000Z",
      githubRepo: "eswarkrishna/FinancialPlanner",
    });
    vi.mocked(fetchRemoteVersion).mockResolvedValue({
      sha: "new-sha",
      short: "new5678",
      date: "2026-07-08T00:00:00.000Z",
    });

    const result = await pollRemoteVersionForUpdate(storage);

    expect(result.isUpdate).toBe(true);
    expect(result.commitSha).toBe("new-sha");
    expect(result.shortCommit).toBe("new5678");
  });

  it("acknowledges remote sha so dismiss does not re-alert with stale bundle", async () => {
    const storage = memoryStorage();
    storage.setItem(LAST_SEEN_COMMIT_SHA_KEY, "old-sha");

    vi.mocked(getBuildInfo).mockReturnValue({
      commitSha: "old-sha",
      commitShort: "old1234",
      commitIsoDate: "2026-07-01T00:00:00.000Z",
      githubRepo: "eswarkrishna/FinancialPlanner",
    });
    vi.mocked(fetchRemoteVersion).mockResolvedValue({
      sha: "new-sha",
      short: "new5678",
      date: "2026-07-08T00:00:00.000Z",
    });

    const remote = await pollRemoteVersionForUpdate(storage);
    acknowledgeVersionUpdate(remote.commitSha, storage);

    const afterDismiss = checkLoadedBuildForUpdate(storage);
    expect(afterDismiss.isUpdate).toBe(false);
    expect(storage.getItem(LAST_SEEN_COMMIT_SHA_KEY)).toBe("new-sha");
    expect(storage.getItem(AWAITING_RELOAD_SHA_KEY)).toBe("new-sha");
  });
});
