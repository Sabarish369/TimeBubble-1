
/**
 * This service worker is required for Firebase Cloud Messaging.
 * It must be in the public directory.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// This configuration is injected by next.config.ts
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
};

if (firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
    
    // It's important to get the messaging instance after initializing
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
      );
    
      const notificationTitle = payload.notification?.title ?? "New Notification";
      const notificationOptions = {
        body: payload.notification?.body ?? "",
        icon: payload.notification?.icon || "/logo.svg",
      };
    
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
} else {
    console.error("Firebase config not found in service worker. Notifications will not work.");
}
