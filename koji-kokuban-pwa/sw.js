// 施工写真 黒板合成 — Service Worker
// ★更新したら必ずこの数字を上げること（v1→v2）。古いキャッシュが残るのを防ぐ。
const CACHE = 'kokuban-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // アプリ起動（ページ遷移）は、まずキャッシュのindexを返す＝オフライン/再起動でも確実に開く
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html')
        .then((hit) => hit || caches.match('./'))
        .then((hit) => hit || fetch(req))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // それ以外（画像など）はキャッシュ優先、なければ取得して保存
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
