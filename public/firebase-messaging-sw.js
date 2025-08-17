
// Use the official Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAG4I-f3oGmyGBJ1Yt2mKpGlZGjqoBDVWE",
  authDomain: "schedule-b95fe.firebaseapp.com",
  projectId: "schedule-b95fe",
  storageBucket: "schedule-b95fe.firebasestorage.app",
  messagingSenderId: "378862884455",
  appId: "1:378862884455:web:88c02590bbb78c40af26c2",
  measurementId: "G-57W71X8MGS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
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
