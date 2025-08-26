
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let messaging: Messaging | null = null;

if (!firebaseConfig.apiKey) {
    console.error("Firebase config is missing or invalid. Please ensure your NEXT_PUBLIC_FIREBASE environment variables are set correctly in your .env file.");
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
} else {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    if (typeof window !== 'undefined') {
        // Set persistence for Auth
        setPersistence(auth, browserLocalPersistence)
            .catch((error) => {
                console.error("Failed to set Firebase Auth persistence:", error);
            });

        // Enable Firestore offline persistence
        enableIndexedDbPersistence(db)
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code === 'unimplemented') {
                    console.warn('Firestore persistence failed: The current browser does not support all of the features required to enable persistence.');
                } else {
                    console.error("Firestore persistence failed:", err);
                }
            });

        // Initialize Messaging
        if ('Notification' in window && 'serviceWorker' in navigator) {
            try {
                messaging = getMessaging(app);
            } catch (error) {
                console.error("Failed to initialize Firebase Messaging:", error);
            }
        }
    }
}

export { app, auth, db, messaging };
