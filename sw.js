const CACHE = 'resume-desk-v5';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/controls.css',
  './css/toast.css',
  './css/editor.css',
  './css/layout.css',
  './css/responsive.css',
  './css/sheet.css',
  './js/app/dom.js',
  './js/app/editor/check.js',
  './js/app/editor/education.js',
  './js/app/editor/events.js',
  './js/app/editor/fields.js',
  './js/app/editor/lists.js',
  './js/app/editor/personal.js',
  './js/app/editor/render.js',
  './js/app/editor/skills.js',
  './js/app/editor/versions.js',
  './js/app/files.js',
  './js/app/history.js',
  './js/app/issues.js',
  './js/app/layout.js',
  './js/app/main.js',
  './js/app/page/apply.js',
  './js/app/page/caret.js',
  './js/app/page/markup.js',
  './js/app/page/render.js',
  './js/app/page/select.js',
  './js/app/page/wire.js',
  './js/app/page/zoom.js',
  './js/app/state.js',
  './js/app/store.js',
  './js/resume/core.js',
  './js/resume/docx.js',
  './js/resume/fonts.js',
  './js/resume/import.js',
  './js/resume/pdf.js',
  './js/vendor/docx.umd.js',
  './js/vendor/jspdf.umd.min.js',
  './js/vendor/pdf.min.js',
  './js/vendor/pdf.worker.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (err) {
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
