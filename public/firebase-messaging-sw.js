// This file is intentionally left blank. It will be overwritten by the build process.
// It gives us a place to put our service worker logic.
// We have to use importScripts to get the firebase libraries.
self.importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAG4I-f3oGmyGBJ1Yt2mKpGlZGjqoBDVWE",
  authDomain: "schedule-b95fe.firebaseapp.com",
  databaseURL: "https://schedule-b95fe-default-rtdb.firebaseio.com",
  projectId: "schedule-b95fe",
  storageBucket: "schedule-b95fe.firebasestorage.app",
  messagingSenderId: "378862884455",
  appId: "1:378862884455:web:88c02590bbb78c40af26c2",
  measurementId: "G-57W71X8MGS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

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
    icon: '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
