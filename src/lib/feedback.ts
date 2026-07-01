/** User feedback links and optional third-party form embed (build-time config). */

const DEFAULT_GITHUB_REPO = "eswarkrishna/FinancialPlanner";

export function getGithubRepo(): string {
  return import.meta.env.VITE_GITHUB_REPO?.trim() || DEFAULT_GITHUB_REPO;
}

export function githubIssuesUrl(repo?: string): string {
  const slug = repo?.trim() || getGithubRepo();
  return `https://github.com/${slug}/issues/new`;
}

/** Embeddable form URL (Typeform, Google Forms, etc.). Empty = hidden. */
export function getFeedbackFormUrl(): string | null {
  const url = import.meta.env.VITE_FEEDBACK_FORM_URL?.trim() ?? "";
  return url.length > 0 ? url : null;
}
