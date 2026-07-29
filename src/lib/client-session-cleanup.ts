const OFFLINE_DB_NAME = "LicenseVaultOfflineDB";

function deleteIndexedDb(name: string): Promise<void> {
  if (typeof indexedDB === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

/** Clears browser data that may contain organization-scoped information. */
export async function clearClientSessionData(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    navigator.serviceWorker?.controller?.postMessage({
      type: "CLEAR_PRIVATE_DATA",
    });
  } catch {
    // Best-effort cleanup; logout must still continue.
  }

  try {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch {
    // Best-effort cleanup; logout must still continue.
  }

  await deleteIndexedDb(OFFLINE_DB_NAME);
}
