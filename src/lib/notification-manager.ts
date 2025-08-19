

/**
 * @fileoverview Manages scheduling and displaying browser push notifications via Firebase Cloud Messaging.
 */

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { urlBase64ToUint8Array } from "./utils";

/**
 * Request notification permission from the user and get FCM token.
 */
export async function requestPermissionAndGetToken(userId: string) {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn("Push notifications are not supported in this browser.");
    return;
  }

  try {
    // First, ensure service worker is registered
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log("Service worker registered successfully");
    
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error("VAPID key is missing from environment variables.");
        return;
      }
      
      const fcmToken = await getToken(messaging, {
        vapidKey: vapidKey,
      });

      if (fcmToken) {
        console.log("FCM Token:", fcmToken);
        // Save the token to the user's document in Firestore
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, { fcmToken }, { merge: true });
        return fcmToken;
      } else {
        console.warn("No registration token available. Request permission to generate one.");
      }
    } else {
      console.warn("Notification permission denied.");
    }
  } catch (error) {
    console.error("An error occurred while requesting permission or getting the token.", error);
    throw error;
  }
}

/**
 * Sets up the listener for foreground messages.
 */
export function setupForegroundMessageListener() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    try {
        const messaging = getMessaging(app);
        
        onMessage(messaging, (payload) => {
            console.log("Foreground message received:", payload);
            // Show a notification for the foreground message.
            // The service worker handles background messages.
            const notificationTitle = payload.notification?.title ?? "New Notification";
            const notificationOptions = {
                body: payload.notification?.body ?? "",
                icon: payload.notification?.icon ?? "/logo.svg",
            };
            
            new Notification(notificationTitle, notificationOptions);
        });
    } catch(e) {
        console.error("Could not set up foreground message listener. Is Firebase configured?", e);
    }
}


/**
 * Clears any scheduled notifications for a specific block.
 * @param blockId The ID of the block whose notifications should be cleared.
 */
export function clearNotification(blockId: string) {
  // This function is now a no-op as notifications are handled by FCM.
}

/**
 * Clears all scheduled notifications.
 */
export function clearAllNotifications() {
  // This function is now a no-op.
}
