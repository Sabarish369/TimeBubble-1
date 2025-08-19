
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

// Check if Firebase config is valid. This is a crucial check.
if (!firebaseConfig.apiKey) {
    console.error("Firebase config is missing or invalid. Please ensure your NEXT_PUBLIC_FIREBASE environment variables are set correctly in your .env file.");
    // Provide dummy objects to prevent the app from crashing on the server or during build.
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
} else {
    // Initialize Firebase only if it hasn't been initialized yet.
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app)
 ;
    // Explicitly set persistence to local
 setPersistence(auth, browserLocalPersistence)
 .catch((error) => {
 console.error("Failed to set Firebase Auth persistence:", error);
 });
    db = getFirestore(app);
 // Enable Firestore offline persistence (optional but recommended)
 enableIndexedDbPersistence(db)
 .catch((err) => console.error("Firestore persistence failed:", err));
    if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
            messaging = getMessaging(app);
        } catch (error) {
            console.error("Failed to initialize Firebase Messaging:", error);
        }
    }
}

export { app, auth, db, messaging };
