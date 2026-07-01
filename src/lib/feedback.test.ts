import { describe, expect, it, vi, afterEach } from "vitest";
import { getGithubRepo, githubIssuesUrl } from "./feedback";

describe("feedback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds GitHub issues URL from default repo", () => {
    vi.stubEnv("VITE_GITHUB_REPO", "");
    expect(githubIssuesUrl()).toBe(
      "https://github.com/eswarkrishna/FinancialPlanner/issues/new",
    );
  });

  it("respects VITE_GITHUB_REPO override", () => {
    vi.stubEnv("VITE_GITHUB_REPO", "acme/planner");
    expect(getGithubRepo()).toBe("acme/planner");
    expect(githubIssuesUrl()).toBe("https://github.com/acme/planner/issues/new");
  });
});
