
/**
 * This service worker is used by Firebase Cloud Messaging to handle background push notifications.
 * It is essential that this file is located in the `public` directory.
 */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// The Firebase config object is injected into the service worker scope by next.config.js
// This is the most reliable way to get environment variables into the service worker.
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
};

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("[firebase-messaging-sw.js] Firebase initialized.");
  } else {
    firebase.app(); // if already initialized, use that one
  }
} catch (e) {
  console.error("[firebase-messaging-sw.js] Error during initialization:", e);
}


// Retrieve an instance of Firebase Messaging so that it can handle background messages.
try {
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon || '/logo.svg',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch(e) {
   console.error("[firebase-messaging-sw.js] Error creating messaging instance:", e);
}
