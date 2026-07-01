import { describe, expect, it } from "vitest";
import {
  formatBuildCommitDate,
  getBuildInfo,
  githubCommitUrl,
} from "./buildInfo";

describe("buildInfo", () => {
  it("reads commit metadata from import.meta.env", () => {
    const info = getBuildInfo();
    expect(info).not.toBeNull();
    expect(info!.commitSha).toMatch(/^[0-9a-f]{40}$/);
    expect(info!.commitShort).toMatch(/^[0-9a-f]+$/);
    expect(info!.commitIsoDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(info!.githubRepo).toBe("eswarkrishna/FinancialPlanner");
  });

  it("formats ISO commit dates for display", () => {
    expect(formatBuildCommitDate("2026-07-01T11:38:16+05:30")).toMatch(/1 Jul 2026/);
  });

  it("builds GitHub commit URLs", () => {
    expect(githubCommitUrl("eswarkrishna/FinancialPlanner", "abc123")).toBe(
      "https://github.com/eswarkrishna/FinancialPlanner/commit/abc123",
    );
  });
});
