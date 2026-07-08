/** docs/SPEC.md §4.15 — build-time version manifest for release checks. */

export type VersionManifest = {
  sha: string;
  short: string;
  date: string;
};

export type GitBuildInfoLike = {
  VITE_BUILD_COMMIT_SHA: string;
  VITE_BUILD_COMMIT_SHORT: string;
  VITE_BUILD_COMMIT_DATE: string;
};

export function versionManifestFromBuild(info: GitBuildInfoLike): VersionManifest | null {
  if (!info.VITE_BUILD_COMMIT_SHA || !info.VITE_BUILD_COMMIT_SHORT) {
    return null;
  }
  return {
    sha: info.VITE_BUILD_COMMIT_SHA,
    short: info.VITE_BUILD_COMMIT_SHORT,
    date: info.VITE_BUILD_COMMIT_DATE,
  };
}

export function versionManifestJson(info: GitBuildInfoLike): string {
  const manifest = versionManifestFromBuild(info);
  return JSON.stringify(manifest ?? { sha: "", short: "", date: "" }, null, 2);
}
