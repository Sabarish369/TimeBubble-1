
// This file needs to be in the public directory.

// Import the Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// with the configuration values passed in from the hosting environment.
if (self.FIREBASE_API_KEY) {
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

    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: payload.notification.icon || '/logo.svg'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} else {
    console.error("Firebase configuration not found in service worker. Push notifications will not work.");
}
