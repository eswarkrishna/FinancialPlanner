import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getFeedbackFormUrl,
  getGithubRepo,
  githubIssuesUrl,
} from "./feedback";

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

  it("returns null when feedback form URL is unset", () => {
    vi.stubEnv("VITE_FEEDBACK_FORM_URL", "");
    expect(getFeedbackFormUrl()).toBeNull();
  });

  it("returns trimmed feedback form URL when set", () => {
    vi.stubEnv(
      "VITE_FEEDBACK_FORM_URL",
      "  https://docs.google.com/forms/d/e/abc/viewform?embedded=true  ",
    );
    expect(getFeedbackFormUrl()).toBe(
      "https://docs.google.com/forms/d/e/abc/viewform?embedded=true",
    );
  });
});
