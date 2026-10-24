/// <reference lib="webworker" />
// Service worker for the installable app. vite-plugin-pwa builds this file and injects the list of
// built files into `self.__WB_MANIFEST` (see vite.config.ts).
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

// The app is rendered on the server, so there is no index.html to precache. Instead the built
// scripts and styles are precached, and the pages themselves are cached as they are visited.
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);
cleanupOutdatedCaches();

/** The page the installed app opens at (see `start_url` in the manifest), saved at install. */
const WARM_PAGES = ["/login"];
const OFFLINE_PAGE = "/offline.html";

// Saved pages point at the scripts of the build that rendered them. Naming the cache after the
// build lets a new version drop them all instead of serving pages whose scripts are gone.
function hashOf(text: string) {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(36);
}
const BUILD = hashOf(
  manifest
    .map((entry) => (typeof entry === "string" ? entry : `${entry.url}@${entry.revision}`))
    .join("|"),
);
const PAGES_CACHE = `vk-pages-${BUILD}`;

self.addEventListener("install", (event) => {
  // A failure here (offline install, say) must not stop the worker from installing
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.addAll(WARM_PAGES))
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("vk-pages-") && name !== PAGES_CACHE)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

// A new version waits until the person taps "Refresh" in the update toast
self.addEventListener("message", (event) => {
  if ((event.data as { type?: string } | null)?.type === "SKIP_WAITING") void self.skipWaiting();
});

// Pages: the network when there is one, the last saved copy when there is not
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: PAGES_CACHE,
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 40 }),
    ],
  }),
);

// Photos on the landing page and in the app are large, so they are saved as they are seen
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith("/images/"),
  new CacheFirst({
    cacheName: "vk-images",
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

// Fonts, so the typography survives offline
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({
    cacheName: "vk-font-styles",
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "vk-font-files",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
);

// A page that was never saved and cannot be fetched gets a plain offline page
setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const offline = await matchPrecache(OFFLINE_PAGE);
    if (offline) return offline;
  }
  return Response.error();
});
