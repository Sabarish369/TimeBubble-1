
'use client';

import { messaging, db } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export async function enablePush({ userId }: { userId: string }) {
  // All logic is temporarily commented out to prevent errors.
  /*
  if (!messaging) {
    throw new Error('Firebase Messaging is not initialized.');
  }
  if (!VAPID_KEY) {
    throw new Error('Firebase VAPID key is not configured in environment variables.');
  }
   if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported by this browser.');
  }

  try {
    // 1) Ask for permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied.');
    }

    // Register the service worker
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // 2) Get FCM Token
    const fcmToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration
    });

    if (fcmToken) {
      // 3) Save token to Firestore
      const userDocRef = doc(db, 'users', userId, 'settings', 'fcm');
      await setDoc(userDocRef, { token: fcmToken }, { merge: true });
      console.log('FCM Token saved for user:', userId);

      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        const { toast } = useToast();
        toast({
          title: payload.notification?.title,
          description: payload.notification?.body,
        });
      });
      
    } else {
      throw new Error('Could not get FCM token.');
    }

    return { ok: true };

  } catch (error) {
    console.error('Error enabling push notifications:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred during push setup.');
  }
  */
  console.log("Push notifications are temporarily disabled.");
  return Promise.resolve({ ok: false, message: "Temporarily disabled" });
}
