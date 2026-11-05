// Keep each deployment's shell and previously opened lessons available offline.
const scope = self.registration.scope;
const prefix = 'cyberedu:' + scope + ':';
const version = prefix + 'v2.8.1-1';
const shell = ['index.html', 'cyberedu.html', 'style.css', 'content.js', 'progress.js',
  'i18n.js', 'script.js', 'flags-hash.js', 'favicon.svg', 'manifest.json'];
const shellURLs = new Set(shell.map(file => new URL(file, scope).href));
const lesson = /^lessons\/[a-z0-9-]+\.(en|zh)\.js$/;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(version).then(cache => cache.addAll(
    [...shellURLs].map(url => new Request(url, {cache: 'reload'}))
  )).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(prefix) && key !== version)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
async function cachedResource(url, warm = false) {
  const cache = await caches.open(version);
  if (warm && await cache.match(url)) return;
  try {
    const response = await fetch(url, {cache: 'no-cache'});
    if (response.ok && !response.redirected) await cache.put(url, response.clone());
    if (response.status >= 500) return await cache.match(url) || response;
    return response;
  } catch (err) {
    const saved = await cache.match(url);
    if (saved) return saved;
    throw err;
  }
}
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.href.startsWith(scope)) return;
  const relative = url.origin + url.pathname;
  if (relative === scope && event.request.mode === 'navigate') {
    event.respondWith(cachedResource(new URL('index.html', scope).href));
  } else if (shellURLs.has(relative) || lesson.test(relative.slice(scope.length))) {
    event.respondWith(cachedResource(relative));
  }
});
// The first lesson may load before this worker takes control.
self.addEventListener('message', event => {
  const path = event.data?.lesson;
  if (typeof path === 'string' && lesson.test(path.replace(/^\.\//, ''))) {
    event.waitUntil(cachedResource(new URL(path, scope).href, true).catch(() => {}));
  }
});
