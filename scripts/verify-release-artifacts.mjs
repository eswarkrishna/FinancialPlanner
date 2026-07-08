/**
 * Shared SPEC §4.15 release-notification artifact checks for deploy and production.
 */

export const RELEASE_NOTIFICATION_TAG = "financial-planner-release";

/**
 * @param {unknown} manifest
 * @param {string} [label]
 * @returns {string[]}
 */
export function validateVersionManifest(manifest, label = "version.json") {
  const failures = [];
  if (!manifest || typeof manifest !== "object") {
    failures.push(`${label}: must be a JSON object`);
    return failures;
  }
  const record = /** @type {Record<string, unknown>} */ (manifest);
  if (typeof record.sha !== "string" || record.sha.length < 7) {
    failures.push(`${label}: sha must be a non-empty git commit id`);
  }
  if (typeof record.short !== "string" || record.short.length < 7) {
    failures.push(`${label}: short must be a non-empty short commit id`);
  }
  if (typeof record.date !== "string" || Number.isNaN(Date.parse(record.date))) {
    failures.push(`${label}: date must be a parseable ISO timestamp`);
  }
  return failures;
}

/**
 * @param {string} swSource
 * @param {string} [label]
 * @returns {string[]}
 */
export function validateServiceWorkerSource(swSource, label = "sw.js") {
  const failures = [];
  if (typeof swSource !== "string" || swSource.length === 0) {
    failures.push(`${label}: must be non-empty`);
    return failures;
  }
  if (/:\s*(string|number|boolean|void|Promise<)/.test(swSource)) {
    failures.push(`${label}: contains TypeScript syntax — must be plain JavaScript`);
  }
  if (!swSource.includes("CHECK_VERSION")) {
    failures.push(`${label}: must handle CHECK_VERSION messages`);
  }
  if (!swSource.includes("notificationclick")) {
    failures.push(`${label}: must handle notificationclick events`);
  }
  if (!swSource.includes(RELEASE_NOTIFICATION_TAG)) {
    failures.push(
      `${label}: missing release notification tag "${RELEASE_NOTIFICATION_TAG}"`,
    );
  }
  return failures;
}

/**
 * @param {string} html
 * @param {string} [label]
 * @returns {string[]}
 */
export function validateIndexHtml(html, label = "index.html") {
  const failures = [];
  if (!html.includes('id="root"')) {
    failures.push(`${label}: missing React root mount point`);
  }
  return failures;
}

/**
 * @param {string[]} failures
 * @param {string} heading
 */
export function reportFailures(failures, heading) {
  if (failures.length === 0) return;
  console.error(`${heading}\n`);
  for (const message of failures) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}
