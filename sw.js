// Service worker do PVCraft Scanner. Gerado no build (vite.config.ts) a partir deste modelo.
// Guarda todos os arquivos do app na instalação e responde do cache: o app abre sem internet.
const CACHE = "pvcraft-152eea4dbad0";
const FILES = ["./","./assets/PdfEditor-C7buVljj.js","./assets/index-BghXutYC.css","./assets/index-DhXiVgMx.js","./assets/ocr-CjCR7t9H.js","./assets/pdf.worker.min-rsCePomN.mjs","./assets/scanlook-DIjM21Ru.js","./assets/worker-zNqMKAm5.js","./fonts/Manrope-Variable.ttf","./icons/apple-touch-icon.png","./icons/favicon-48.png","./icons/icon-192.png","./icons/icon-512.png","./icons/simbolo.svg","./index.html","./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

// Fontes de substituição e reconhecedor de texto (motor e idiomas): baixados no primeiro uso e
// guardados à parte, para continuarem no aparelho quando o app é atualizado. Se um dia o motor
// (public/ocr/worker.min.js e tesseract-core-*) mudar de versão, troque o número deste nome.
const EXTRAS = "pvcraft-extras-1";
const isExtra = (url) => /\/(fontes-pdf|ocr)\//.test(new URL(url).pathname);

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("pvcraft-") && k !== CACHE && k !== EXTRAS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// ignoreVary: alguns servidores mandam "Vary: Origin", e aí o pedido do <script type="module">
// não casa com a cópia guardada na instalação. Só há arquivos do próprio app aqui, sem variação.
const MATCH = { ignoreSearch: true, ignoreVary: true };

async function extra(request) {
  const cache = await caches.open(EXTRAS);
  // a lista de idiomas pode crescer numa atualização: vale a da rede; a guardada, só sem internet
  const fresh = new URL(request.url).pathname.endsWith("/langs.json");
  if (!fresh) {
    const hit = await cache.match(request, MATCH);
    if (hit) return hit;
  }
  try {
    const response = await fetch(request);
    if (response.ok) void cache.put(request, response.clone());
    return response;
  } catch (error) {
    const hit = await cache.match(request, MATCH);
    if (hit) return hit;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (isExtra(request.url)) {
    event.respondWith(extra(request));
    return;
  }
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
