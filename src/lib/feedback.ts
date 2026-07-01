/** User feedback links (build-time config). */

const DEFAULT_GITHUB_REPO = "eswarkrishna/FinancialPlanner";

export function getGithubRepo(): string {
  return import.meta.env.VITE_GITHUB_REPO?.trim() || DEFAULT_GITHUB_REPO;
}

export function githubIssuesUrl(repo?: string): string {
  const slug = repo?.trim() || getGithubRepo();
  return `https://github.com/${slug}/issues/new`;
}
