/**
 * Минимальный SW: при обрыве сети для HTML-навигации отдаём закешированный SPA shell.
 * Не кэшируем /api — только origin HTML.
 */
const CACHE = "egepro-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(`${self.location.origin}/index.html`, { cache: "reload" })))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isHtml =
    request.mode === "navigate" || (request.headers.get("accept") ?? "").includes("text/html");
  if (!isHtml) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const shellUrl = `${self.location.origin}/index.html`;
          caches.open(CACHE).then((c) => c.put(shellUrl, res.clone())).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(`${self.location.origin}/index.html`).then((r) => r ?? Response.error()),
      ),
  );
});
