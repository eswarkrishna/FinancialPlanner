/** Deploy metadata baked in at build time (SPEC §8). */

const DEFAULT_GITHUB_REPO = "eswarkrishna/FinancialPlanner";

export type BuildInfo = {
  commitSha: string;
  commitShort: string;
  commitIsoDate: string;
  githubRepo: string;
};

export function getBuildInfo(): BuildInfo | null {
  const commitSha = import.meta.env.VITE_BUILD_COMMIT_SHA ?? "";
  const commitShort = import.meta.env.VITE_BUILD_COMMIT_SHORT ?? "";
  const commitIsoDate = import.meta.env.VITE_BUILD_COMMIT_DATE ?? "";
  const githubRepo = import.meta.env.VITE_GITHUB_REPO?.trim() || DEFAULT_GITHUB_REPO;

  if (!commitSha || !commitShort || !commitIsoDate) {
    return null;
  }

  return { commitSha, commitShort, commitIsoDate, githubRepo };
}

export function formatBuildCommitDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function githubCommitUrl(repo: string, sha: string): string {
  return `https://github.com/${repo}/commit/${sha}`;
}
