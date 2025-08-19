
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
  appId: "1:378862884455:web:88c02590bbb78c40af26c2",
  measurementId: "G-57W71X8MGS"
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
