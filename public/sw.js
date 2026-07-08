const VERSION_CACHE = "fp-version-v1";

let versionCheckUrl = "version.json";

function scopeBase() {
  const scope = self.registration?.scope ?? "/";
  return scope.endsWith("/") ? scope : `${scope}/`;
}

function iconUrl() {
  return `${scopeBase()}favicon.svg`;
}

function openSiteUrl() {
  return scopeBase();
}

async function readStoredSha() {
  const cache = await caches.open(VERSION_CACHE);
  const response = await cache.match("sha");
  if (!response) return null;
  return response.text();
}

async function writeStoredSha(sha) {
  const cache = await caches.open(VERSION_CACHE);
  await cache.put("sha", new Response(sha));
}

async function checkForUpdate(notify) {
  try {
    const response = await fetch(`${versionCheckUrl}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) return;

    const remote = await response.json();
    if (!remote || typeof remote.sha !== "string" || typeof remote.short !== "string") {
      return;
    }

    const previous = await readStoredSha();
    if (previous && previous !== remote.sha && notify) {
      await self.registration.showNotification("FinancialPlanner update", {
        body: `Version ${remote.short} is live. Open the app to refresh.`,
        tag: "financial-planner-release",
        icon: iconUrl(),
        data: { url: openSiteUrl() },
      });
    }

    if (!previous || previous !== remote.sha) {
      await writeStoredSha(remote.sha);
    }
  } catch {
    // Offline or blocked fetch — skip
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "SET_VERSION_URL" && typeof data.url === "string") {
    versionCheckUrl = data.url;
    return;
  }

  if (data.type === "CHECK_VERSION") {
    event.waitUntil(checkForUpdate(true));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    typeof event.notification.data?.url === "string"
      ? event.notification.data.url
      : openSiteUrl();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
