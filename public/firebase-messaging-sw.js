// This file must be in the /public directory.

// Imports the Firebase app and messaging scripts.
// See: https://firebase.google.com/docs/web/setup#access-firebase
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker with your project's configuration.
// These values are hardcoded because the service worker cannot access environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyAG4I-f3oGmyGBJ1Yt2mKpGlZGjqoBDVWE",
  authDomain: "schedule-b95fe.firebaseapp.com",
  projectId: "schedule-b95fe",
  storageBucket: "schedule-b95fe.firebasestorage.app",
  messagingSenderId: "378862884455",
  appId: "1:378862884455:web:88c02590bbb78c40af26c2",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
