import type { VersionManifest } from "./versionManifest";

function normalizeBase(base: string): string {
  if (!base || base === "/") return "/";
  return base.endsWith("/") ? base : `${base}/`;
}

export function versionJsonUrl(baseUrl: string = import.meta.env.BASE_URL ?? "/"): string {
  return `${normalizeBase(baseUrl)}version.json`;
}

export function serviceWorkerUrl(baseUrl: string = import.meta.env.BASE_URL ?? "/"): string {
  return `${normalizeBase(baseUrl)}sw.js`;
}

export async function fetchRemoteVersion(
  baseUrl?: string,
): Promise<VersionManifest | null> {
  try {
    const url = `${versionJsonUrl(baseUrl)}?t=${Date.now()}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return null;
    const manifest = data as Partial<VersionManifest>;
    if (typeof manifest.sha !== "string" || typeof manifest.short !== "string") {
      return null;
    }
    return {
      sha: manifest.sha,
      short: manifest.short,
      date: typeof manifest.date === "string" ? manifest.date : "",
    };
  } catch {
    return null;
  }
}

export async function registerReleaseServiceWorker(
  baseUrl?: string,
): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(
      serviceWorkerUrl(baseUrl),
      { scope: normalizeBase(baseUrl ?? import.meta.env.BASE_URL ?? "/") },
    );
    const versionUrl = versionJsonUrl(baseUrl);
    const postConfig = (worker: ServiceWorker | null) => {
      worker?.postMessage({ type: "SET_VERSION_URL", url: versionUrl });
    };
    postConfig(registration.installing);
    postConfig(registration.waiting);
    postConfig(registration.active);
    registration.addEventListener("updatefound", () => {
      postConfig(registration.installing);
    });
    return registration;
  } catch {
    return null;
  }
}

export function pingServiceWorkerVersionCheck(): void {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) {
    return;
  }
  navigator.serviceWorker.controller.postMessage({ type: "CHECK_VERSION" });
}
