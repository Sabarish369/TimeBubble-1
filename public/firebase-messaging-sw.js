
/**
 * This service worker is used by Firebase Cloud Messaging to handle background push notifications.
 * It is essential that this file is located in the `public` directory.
 */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Firebase configuration - these values should match your .env.local
const firebaseConfig = {
  apiKey: "AIzaSyAG4I-f3oGmyGBJ1Yt2mKpGlZGjqoBDVWE",
  authDomain: "schedule-b95fe.firebaseapp.com",
  projectId: "schedule-b95fe",
  storageBucket: "schedule-b95fe.firebasestorage.app",
  messagingSenderId: "378862884455",
  appId: "1:378862884455:web:88c02590bbb78c40af26c2"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'TimeBubble Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Task'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'view') {
    // Open the app and navigate to the specific task
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click behavior - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
