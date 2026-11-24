// Service worker do PVCraft Scanner. Gerado no build (vite.config.ts) a partir deste modelo.
// Guarda todos os arquivos do app na instalação e responde do cache: o app abre sem internet.
const CACHE = "pvcraft-eb85d49cffdf";
const FILES = ["./","./assets/index-DX0ubAOZ.css","./assets/index-Dp1xA3kR.js","./assets/worker-zNqMKAm5.js","./fonts/Manrope-Variable.ttf","./icons/apple-touch-icon.png","./icons/favicon-48.png","./icons/icon-192.png","./icons/icon-512.png","./icons/simbolo.svg","./index.html","./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("pvcraft-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// ignoreVary: alguns servidores mandam "Vary: Origin", e aí o pedido do <script type="module">
// não casa com a cópia guardada na instalação. Só há arquivos do próprio app aqui, sem variação.
const MATCH = { ignoreSearch: true, ignoreVary: true };

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request, MATCH);
      if (hit) return hit;
      try {
        return await fetch(request);
      } catch (error) {
        // sem internet: qualquer navegação cai na página do app
        const page = request.mode === "navigate" ? await cache.match("./index.html", MATCH) : null;
        if (page) return page;
        throw error;
      }
    }),
  );
});
