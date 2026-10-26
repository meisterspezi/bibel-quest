// Offline-Speicher für Bibelbuch-Quest. Bei Änderungen an der App die Versionsnummer erhöhen.
const VERSION = "bibel-quest-v6-12";
const APP = ["./", "index.html", "daten.js", "symbole.js", "spiel.js", "logo.png", "qrcode.js", "firebase-config.js", "leaderboard.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-512-maskable.png", "icons/icon-180.png", "icons/favicon-32.png"];
// Fremde Dateien, die offline mitgespeichert werden dürfen (Schriften, Firebase-Bibliothek).
// Die Ranglisten-Daten selbst (googleapis.com) werden NIE zwischengespeichert.
const CACHE_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "www.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (!same && !CACHE_HOSTS.includes(url.hostname)) return; // Rangliste & Anmeldung immer live
  if (req.headers.has("range") || url.pathname.includes("/lied/")) return; // Lieder (Audio, PDF) direkt laden

  // Seite und eigene Skripte: erst Netz (für Updates), sonst Offline-Kopie
  if (same) {
    // „no-cache“: beim Server nachfragen, ob es eine neuere Datei gibt (sonst hält der Browser bis zu 10 Min. die alte)
    e.respondWith(fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req.mode === "navigate" ? "index.html" : req, c)); }
      return r;
    }).catch(() => caches.match(req.mode === "navigate" ? "index.html" : req, { ignoreSearch: true })));
    return;
  }
  // Schriften und Firebase-Bibliothek: erst Speicher, dann Netz
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
    return r;
  })));
});
