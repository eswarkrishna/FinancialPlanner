import { execSync } from "node:child_process";

/** Git metadata embedded at Vite compile time (SPEC §8 deploy metadata). */
export type GitBuildInfo = {
  VITE_BUILD_COMMIT_SHA: string;
  VITE_BUILD_COMMIT_SHORT: string;
  VITE_BUILD_COMMIT_DATE: string;
};

function git(args: string): string {
  try {
    return execSync(`git ${args}`, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

export function getGitBuildInfo(): GitBuildInfo {
  return {
    VITE_BUILD_COMMIT_SHA: git("rev-parse HEAD"),
    VITE_BUILD_COMMIT_SHORT: git("rev-parse --short HEAD"),
    VITE_BUILD_COMMIT_DATE: git("log -1 --format=%cI"),
  };
}

/** Vite `define` map for import.meta.env.VITE_BUILD_* keys. */
export function buildInfoDefine(info: GitBuildInfo): Record<string, string> {
  return Object.fromEntries(
    Object.entries(info).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ]),
  );
}
