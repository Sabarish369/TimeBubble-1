
'use client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePush({ userId }: { userId: string }) {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VAPID public key not configured.');
  }

  if (!('serviceWorker' in navigator)) throw new Error('Service Workers are not supported');
  if (!('PushManager' in window)) throw new Error('Push messaging is not supported');

  // 1) Ask permission
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permission denied');

  // 2) Register SW
  const reg = await navigator.serviceWorker.register('/sw.js');

  // 3) Subscribe
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  // 4) Send to our server
  await fetch('/api/save-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, subscription: sub })
  });

  return { ok: true };
}
