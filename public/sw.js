/* sw.js */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || 'TimeBubble';
  const body = data.body || 'You have something coming up.';
  const url = data.url || '/';
  const icon = data.icon || '/icons/icon-192.png';
  const badge = data.badge || '/icons/badge-72.png';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      vibrate: [80, 40, 80],
      tag: data.tag || 'timebubble',
      renotify: false,
      requireInteraction: !!data.requireInteraction
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { url } = event.notification.data || { url: '/' };
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = all.find(c => c.url.includes(new URL(url, self.location.origin).pathname));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })()
  );
});
