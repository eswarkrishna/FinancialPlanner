/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_BUILD_COMMIT_SHA?: string;
  readonly VITE_BUILD_COMMIT_SHORT?: string;
  readonly VITE_BUILD_COMMIT_DATE?: string;
  readonly VITE_GITHUB_REPO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
