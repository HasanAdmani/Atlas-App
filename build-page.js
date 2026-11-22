// Joins the source parts in src/ into app/index.html and generates PWA assets.
// Run by "npm start", "npm run serve", "npm run build:page", and "npm run dist".
const fs = require('fs');
const path = require('path');

const order = ['p1.html', 'p2.js', 'p3.js', 'p4a.js', 'p4b.js', 'p5a.js', 'p6.js', 'p7.js', 'p8.js', 'p9.js', 'p5b.js'];
const body = order.map((f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8')).join('');

const dossiersDir = path.join(__dirname, 'dossiers');
const dossiersPayload = [];
if (fs.existsSync(path.join(dossiersDir, 'index.json'))) {
  const index = JSON.parse(fs.readFileSync(path.join(dossiersDir, 'index.json'), 'utf8'));
  index.forEach((entry) => {
    const filePath = path.join(dossiersDir, entry.file);
    if (fs.existsSync(filePath)) {
      dossiersPayload.push(Object.assign({}, entry, { data: JSON.parse(fs.readFileSync(filePath, 'utf8')) }));
    }
  });
}
const dossiersScript = '<script>window.__ATLAS_DOSSIERS__=' + JSON.stringify(dossiersPayload).replace(/<\//g, '<\\/') + ';</script>';

const headTags = [
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
  '<script>if(location.pathname==="/atlas")location.replace("/atlas/"+location.search+location.hash);</script>',
  '<meta name="theme-color" content="#2945B8">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="apple-mobile-web-app-title" content="Atlas">',
  '<link rel="icon" type="image/svg+xml" href="icon.svg">',
  '<link rel="apple-touch-icon" href="icon.svg">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<style>:root{color-scheme:light dark}body{margin:0;font:14px system-ui}</style>',
  dossiersScript,
].join('');

const html = '<!doctype html>\n<html lang="en"><head>' + headTags + '</head><body>\n' + body + '\n</body></html>\n';

const appDir = path.join(__dirname, 'app');
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(path.join(appDir, 'index.html'), html);

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#2945B8"/>
  <text x="256" y="352" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="330" fill="#F7F8F5">A</text>
</svg>\n`;
fs.writeFileSync(path.join(appDir, 'icon.svg'), iconSvg);

const manifest = {
  name: 'Atlas — Degree Planner',
  short_name: 'Atlas',
  description: 'Grades, GPA lab, curriculum roadmap, minors, and enrollment planning.',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#F3F4F1',
  theme_color: '#2945B8',
  icons: [
    {
      src: 'icon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any maskable',
    },
  ],
};
fs.writeFileSync(path.join(appDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');

const swJs = `// Atlas PWA Service Worker — network-first shell cache for offline startup.
const CACHE_NAME = 'atlas-shell-v1';
const SHELL_ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
`;
fs.writeFileSync(path.join(appDir, 'sw.js'), swJs);

console.log('app/index.html written (' + Math.round(html.length / 1024) + ' KB) + PWA assets');
