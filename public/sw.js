// ============================================================
// License Vault Service Worker v2
// Enhanced with offline page, background sync, push notifications,
// cache versioning, and periodic background sync
// ============================================================

const CACHE_VERSION = 'v2';
const CACHE_NAMES = {
  static: `license-vault-static-${CACHE_VERSION}`,
  dynamic: `license-vault-dynamic-${CACHE_VERSION}`,
  api: `license-vault-api-${CACHE_VERSION}`,
  offline: `license-vault-offline-${CACHE_VERSION}`,
};

// Static assets to pre-cache during install
const STATIC_ASSETS = [
  '/',
  '/en/dashboard',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/maskable-icon.svg',
];

// Offline fallback page HTML
const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - License Vault</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .container {
      text-align: center;
      max-width: 480px;
      padding: 2.5rem;
    }
    .icon-wrapper {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(20,184,166,0.1));
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s ease-in-out infinite;
    }
    .icon-wrapper svg { width: 40px; height: 40px; color: #10b981; }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(90deg, #e2e8f0, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p { color: #94a3b8; margin-bottom: 1rem; line-height: 1.6; }
    .features {
      background: rgba(30,41,59,0.5);
      border: 1px solid rgba(51,65,85,0.5);
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin: 1.5rem 0;
      text-align: start;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }
    .feature-icon { color: #10b981; flex-shrink: 0; }
    .feature-text { color: #cbd5e1; }
    .retry-btn {
      background: linear-gradient(135deg, #10b981, #14b8a6);
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .retry-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5L12 2.25l9 5.25v6l-9 5.25-9-5.25V7.5z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 22.5V12" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M22.5 7.5L12 12 1.5 7.5" />
      </svg>
    </div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Don't worry — some features are still available.</p>
    <div class="features">
      <div class="feature">
        <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span class="feature-text">View cached license data</span>
      </div>
      <div class="feature">
        <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span class="feature-text">Browse compliance reports</span>
      </div>
      <div class="feature">
        <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span class="feature-text">Access team information</span>
      </div>
      <div class="feature">
        <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        <span class="feature-text">Changes will sync when you're back online</span>
      </div>
    </div>
    <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
`;

// ============================================================
// INSTALL EVENT - Pre-cache static assets and offline page
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.static).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(CACHE_NAMES.offline).then((cache) => {
        const response = new Response(OFFLINE_PAGE, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
        return cache.put('/offline', response);
      }),
    ])
  );
  self.skipWaiting();
});

// ============================================================
// ACTIVATE EVENT - Clean old caches, claim clients
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete caches that don't match any of our current cache names
            return !Object.values(CACHE_NAMES).includes(name);
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ============================================================
// FETCH EVENT - Routing strategies based on request type
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST/PUT/DELETE handled by sync)
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Skip Next.js hot reload and dev requests
  if (url.pathname.includes('/_next/') && url.pathname.includes('hmr')) return;

  // ---- API requests: Network-only with cache fallback for GET ----
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAMES.api).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              // Add a header to indicate stale data
              const headers = new Headers(cached.headers);
              headers.set('X-Served-From', 'cache');
              headers.set('X-Cache-Age', new Date().toISOString());
              return new Response(cached.body, {
                status: cached.status,
                statusText: cached.statusText,
                headers,
              });
            }
            return new Response(JSON.stringify({ error: 'offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // ---- HTML pages: Network-first with offline page fallback ----
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAMES.dynamic).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Show offline fallback page
            return caches.match('/offline');
          });
        })
    );
    return;
  }

  // ---- Static assets (JS/CSS/images): Cache-first with network fallback ----
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname.includes('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAMES.static).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ---- Other requests: Network-first with cache fallback ----
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAMES.dynamic).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ============================================================
// BACKGROUND SYNC - Queue offline form submissions
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'license-submit') {
    event.waitUntil(replayOfflineSubmissions('license'));
  } else if (event.tag === 'compliance-check') {
    event.waitUntil(replayOfflineSubmissions('compliance'));
  } else if (event.tag === 'general-sync') {
    event.waitUntil(replayOfflineSubmissions('general'));
  }
});

async function replayOfflineSubmissions(type) {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction('pendingRequests', 'readonly');
    const store = tx.objectStore('pendingRequests');
    const allRequests = await store.getAll();

    const matching = allRequests.filter((req) => req.type === type || type === 'general');

    for (const entry of matching) {
      try {
        const response = await fetch(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: entry.body,
        });

        if (response.ok) {
          // Remove from IndexedDB on success
          const deleteTx = db.transaction('pendingRequests', 'readwrite');
          const deleteStore = deleteTx.objectStore('pendingRequests');
          await deleteStore.delete(entry.id);

          // Notify clients about successful sync
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'SYNC_COMPLETE',
                payload: {
                  originalUrl: entry.url,
                  method: entry.method,
                  status: response.status,
                },
              });
            });
          });
        }
      } catch (err) {
        // Will retry on next sync event
        console.error('Replay failed for', entry.url, err);
      }
    }
  } catch (err) {
    console.error('Failed to replay offline submissions:', err);
  }
}

// IndexedDB helper for offline request queue
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LicenseVaultOfflineDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const store = db.createObjectStore('pendingRequests', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// ============================================================
// PUSH NOTIFICATIONS - Handle push events
// ============================================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'License Vault',
    body: 'You have a new notification.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/maskable-icon-192x192.png',
    tag: 'license-vault-notification',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const actions = [
    { action: 'view', title: 'View Details' },
    { action: 'dismiss', title: 'Dismiss' },
  ];

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      actions,
      vibrate: [100, 50, 100],
      renotify: true,
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === 'dismiss') return;

  // Default: open/focus the app and navigate to relevant page
  const targetUrl = notificationData.url || '/en/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ============================================================
// PERIODIC BACKGROUND SYNC - Compliance checks (when supported)
// ============================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'compliance-periodic-check') {
    event.waitUntil(performPeriodicComplianceCheck());
  }
});

async function performPeriodicComplianceCheck() {
  try {
    const response = await fetch('/api/dashboard?XTransformPort=3000', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const summary = data.summary || {};

      // Check for expiring or expired licenses
      const expiringCount = summary.expiringSoon || 0;
      const expiredCount = summary.expired || 0;

      if (expiredCount > 0 || expiringCount > 0) {
        const title = expiredCount > 0
          ? `${expiredCount} License(s) Expired!`
          : `${expiringCount} License(s) Expiring Soon`;

        const body = expiredCount > 0
          ? `You have ${expiredCount} expired license(s) that need attention.`
          : `${expiringCount} license(s) will expire soon. Review them now.`;

        self.registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/maskable-icon-192x192.png',
          tag: 'compliance-check',
          data: { url: '/en/licenses?status=expired' },
          vibrate: [100, 50, 100],
        });
      }
    }
  } catch (err) {
    // Silently fail - we'll try again next period
    console.error('Periodic compliance check failed:', err);
  }
}

// ============================================================
// MESSAGE HANDLER - Communication from main thread
// ============================================================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'QUEUE_OFFLINE_REQUEST': {
      // Queue a request for background sync when back online
      const { url, method, headers, body, requestType } = payload;
      queueOfflineRequest(url, method, headers, body, requestType);
      break;
    }
    case 'SKIP_WAITING': {
      self.skipWaiting();
      break;
    }
    case 'GET_CACHE_SIZE': {
      getCacheSize().then((size) => {
        event.ports[0]?.postMessage({ type: 'CACHE_SIZE', payload: size });
      });
      break;
    }
    case 'CLEAR_CACHES': {
      caches.keys().then((names) => {
        Promise.all(names.map((name) => caches.delete(name))).then(() => {
          event.ports[0]?.postMessage({ type: 'CACHES_CLEARED' });
        });
      });
      break;
    }
  }
});

async function queueOfflineRequest(url, method, headers, body, requestType) {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction('pendingRequests', 'readwrite');
    const store = tx.objectStore('pendingRequests');
    await store.add({
      url,
      method: method || 'POST',
      headers: headers || {},
      body: body || null,
      type: requestType || 'general',
      timestamp: Date.now(),
    });

    // Register for background sync
    self.registration.sync.register('general-sync').catch(() => {
      // Sync not supported, will retry on next online event
    });
  } catch (err) {
    console.error('Failed to queue offline request:', err);
  }
}

async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    totalSize += requests.length;
  }
  return { caches: cacheNames.length, entries: totalSize };
}
