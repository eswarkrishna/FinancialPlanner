export function getBaseUrl(): string {
  const url = process.env.E2E_BASE_URL?.trim();
  if (!url) {
    throw new Error("E2E_BASE_URL is not set. Import e2e/setup.ts before running specs.");
  }
  return url.replace(/\/$/, "");
}
