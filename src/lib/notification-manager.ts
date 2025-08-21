
/**
 * @fileoverview Manages scheduling and displaying browser push notifications via Firebase Cloud Messaging.
 */

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

/**
 * Request notification permission from the user and get FCM token.
 */
export async function requestPermissionAndGetToken(userId: string) {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn("Push notifications are not supported in this browser.");
    return;
  }

  try {
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
      // The rest of the logic can be added here if FCM is re-enabled
    } else {
      console.warn("Notification permission denied.");
    }
  } catch (error) {
    console.error("An error occurred while requesting permission.", error);
  }
}

/**
 * Sets up the listener for foreground messages.
 */
export function setupForegroundMessageListener() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    // This function can be expanded if FCM is used in the future.
}
