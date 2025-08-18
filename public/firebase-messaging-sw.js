
// Use the compatible, namespaced version of the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// These variables are injected by next.config.js
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
};

// Initialize the Firebase app in the service worker
try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);

    // Customize the notification here
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification.',
      icon: payload.notification?.icon || '/logo.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  console.log('[firebase-messaging-sw.js] Service worker initialized successfully.');

} catch (error) {
    console.error('[firebase-messaging-sw.js] Error during initialization:', error);
}
