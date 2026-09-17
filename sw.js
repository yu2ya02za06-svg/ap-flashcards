// 応用情報 一問一答 — アプリ本体とカードをキャッシュしてオフラインで使えるようにする
const CACHE = "ap-cards-v1";
const APP = ["./", "./index.html", "./cards.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./maskable-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  if (req.mode === "navigate" || (same && url.pathname.endsWith("/cards.js"))) {
    // ネット優先（カードの更新をすぐ反映）、つながらなければキャッシュ
    const key = req.mode === "navigate" ? "./index.html" : req;
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(key, cp)); } return res; })
      .catch(() => caches.match(key)));
    return;
  }
  if (same || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
      return res;
    })));
  }
});
