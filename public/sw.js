// This app is in active daily development. A service worker that caches
// anything at all is a liability right now — it's already trapped at least
// one user behind a stale build across several deploys. So instead of
// trying to get caching strategy right, this version just tears itself
// down: unregister, wipe every cache, and force any open tabs to reload
// straight from the network. Revisit real offline support later once the
// app is stable (Stage 2+).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clientsList = await self.clients.matchAll({ type: "window" });
      clientsList.forEach((client) => client.navigate(client.url));
    })()
  );
});
