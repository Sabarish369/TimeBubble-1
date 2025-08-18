/**
 * @fileoverview Firebase Cloud Messaging Service Worker.
 *
 * This file is executed in a separate thread by the browser and is responsible
 * for handling background push notifications. It initializes Firebase with
 * configuration variables injected during the build process.
 */

// Import the Firebase app and messaging services
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// The `self` object refers to the service worker's global scope.
// These FIREBASE_... variables are injected by the Webpack DefinePlugin in next.config.ts.
if (self.FIREBASE_MESSAGING_SENDER_ID) {
  // Initialize the Firebase app in the service worker
  firebase.initializeApp({
    apiKey: self.FIREBASE_API_KEY,
    authDomain: self.FIREBASE_AUTH_DOMAIN,
    projectId: self.FIREBASE_PROJECT_ID,
    storageBucket: self.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
    appId: self.FIREBASE_APP_ID,
  });

  // Retrieve an instance of Firebase Messaging so that it can handle background messages.
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Customize notification here from the received payload.
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/logo.svg' // You can also use payload.notification.icon if it's sent.
    };

    // The showNotification method is part of the Service Worker API.
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
    console.error('Firebase messagingSenderId is not available in the service worker. Push notifications will not work in the background.');
}
