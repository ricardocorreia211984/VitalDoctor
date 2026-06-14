// VitalDoctor Service Worker — cache da app para abrir offline
const CACHE = 'vitaldoctor-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // Nunca cachear pedidos ao Supabase (dados em tempo real precisam de net)
  if (url.includes('supabase.co') || url.includes('esm.sh')) {
    return; // deixa passar normalmente; offline devolve erro tratado na app
  }
  // App shell: tenta rede, cai para cache (permite abrir offline)
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('/index.html')))
  );
});
