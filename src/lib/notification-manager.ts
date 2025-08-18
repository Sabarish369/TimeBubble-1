
/**
 * @fileoverview Manages scheduling and displaying browser push notifications via Firebase Cloud Messaging.
 */

import type { TimeBlock } from "@/types";
import { ensureDateObject } from "./time-bubbles-utils";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

// Store timeout IDs in a map for easy cancellation
const notificationTimeouts = new Map<string, number[]>();

/**
 * Request notification permission from the user and get FCM token.
 */
export async function requestPermissionAndGetToken(userId: string) {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn("Push notifications are not supported in this browser.");
    return;
  }
  
  const messaging = getMessaging(app);

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
      
      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (fcmToken) {
        console.log("FCM Token:", fcmToken);
        // Save the token to the user's document in Firestore
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, { fcmToken }, { merge: true });
      } else {
        console.warn("No registration token available. Request permission to generate one.");
      }
    } else {
      console.warn("Notification permission denied.");
    }
  } catch (error) {
    console.error("An error occurred while requesting permission or getting the token.", error);
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
  if (notificationTimeouts.has(blockId)) {
    const timeouts = notificationTimeouts.get(blockId)!;
    timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    notificationTimeouts.delete(blockId);
  }
}

/**
 * Clears all scheduled notifications.
 */
export function clearAllNotifications() {
  for (const blockId of notificationTimeouts.keys()) {
    clearNotification(blockId);
  }
  notificationTimeouts.clear();
}
