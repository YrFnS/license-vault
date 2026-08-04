// License Vault service worker v3
// Privacy-first: authenticated pages and API responses are never cached.

const CACHE_VERSION = "v3";
const STATIC_CACHE = `license-vault-static-${CACHE_VERSION}`;
const OFFLINE_CACHE = `license-vault-offline-${CACHE_VERSION}`;
const OFFLINE_PATH = "/offline";
const PRIVATE_DB_NAME = "LicenseVaultOfflineDB";

const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/maskable-icon.svg",
];

const OFFLINE_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="theme-color" content="#059669" />
  <title>Offline · License Vault</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fafc;color:#0f172a;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:min(440px,100%);border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:32px;text-align:center;box-shadow:0 12px 35px rgba(15,23,42,.08)}.icon{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 20px;border-radius:16px;background:#ecfdf5;color:#047857;font-size:30px}h1{margin:0;font-size:24px}p{margin:12px 0 24px;color:#64748b;line-height:1.6}button{border:0;border-radius:10px;background:#059669;color:#fff;padding:11px 18px;font:inherit;font-weight:600;cursor:pointer}button:hover{background:#047857}@media(prefers-color-scheme:dark){body{background:#020617;color:#f8fafc}.card{border-color:#1e293b;background:#0f172a}.icon{background:#052e2b;color:#6ee7b7}p{color:#94a3b8}}
  </style>
</head>
<body>
  <main class="card">
    <div class="icon" aria-hidden="true">◆</div>
    <h1>You are offline</h1>
    <p>Reconnect to view current license and compliance data. Private account information is not stored in the offline cache.</p>
    <button type="button" onclick="location.reload()">Try again</button>
  </main>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(OFFLINE_CACHE).then((cache) =>
        cache.put(
          OFFLINE_PATH,
          new Response(OFFLINE_PAGE, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }),
        ),
      ),
    ]),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== STATIC_CACHE && name !== OFFLINE_CACHE)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith("http")) return;

  // Account APIs are always network-only to prevent cross-user or stale data leaks.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Never cache authenticated HTML. Only display the static offline page when needed.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () =>
        (await caches.match(OFFLINE_PATH)) ||
        new Response("Offline", { status: 503 }),
      ),
    );
    return;
  }

  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      /\.(?:css|js|png|jpe?g|gif|svg|ico|webp|woff2?)$/i.test(url.pathname));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "License Vault",
    body: "You have a new notification.",
    icon: "/icons/icon.svg",
    badge: "/icons/maskable-icon.svg",
    tag: "license-vault-notification",
    data: {},
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      actions: [
        { action: "view", title: "View details" },
        { action: "dismiss", title: "Dismiss" },
      ],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/en/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const client = clients.find((item) => item.url.startsWith(self.location.origin));
        if (client) {
          client.navigate(targetUrl);
          return client.focus();
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});

function deletePrivateDatabase() {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(PRIVATE_DB_NAME);
    request.onsuccess = request.onerror = request.onblocked = () => resolve();
  });
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "CLEAR_PRIVATE_DATA" || event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      Promise.all([
        caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name)))),
        deletePrivateDatabase(),
      ]),
    );
  }
});
