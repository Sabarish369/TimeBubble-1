/**
 * @fileoverview Manages scheduling and displaying browser notifications.
 * This is a self-contained module to be used on the client-side.
 * It does not use Service Workers, so notifications only work while the
 * browser tab is open and may be delayed if the tab is inactive.
 */

import type { TimeBlock } from "@/types";
import { ensureDateObject } from "./time-bubbles-utils";

// Store timeout IDs in a map for easy cancellation
const notificationTimeouts = new Map<string, number[]>();

const PRE_START_ALERT_MINUTES = 5;

/**
 * Request notification permission from the user.
 */
export function requestPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/**
 * Schedules a notification for a given time block.
 * @param block The time block to schedule a notification for.
 * @param onNotify Callback function when the notification fires.
 */
export function scheduleNotification(
  block: TimeBlock,
  onNotify: (block: TimeBlock) => void
) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') {
    return;
  }

  clearNotification(block.id); // Clear any existing timeouts for this block

  const now = new Date();
  const timeouts: number[] = [];

  const startTime = ensureDateObject(block.startTime);

  // --- Validate Date Object ---
  if (isNaN(startTime.getTime())) {
    console.error(`[NotificationManager] Invalid startTime for block "${block.title}" (ID: ${block.id}). Notification not scheduled.`);
    return;
  }

  // --- Schedule Pre-Start Notification ---
  const preAlertTime = new Date(startTime.getTime() - PRE_START_ALERT_MINUTES * 60000);
  const preAlertTimeoutMs = preAlertTime.getTime() - now.getTime();

  if (preAlertTimeoutMs > 0) {
    const preAlertTimeoutId = window.setTimeout(() => {
      showNotification(
        `Get ready, "${block.title}" starts in ${PRE_START_ALERT_MINUTES} minutes.`,
        'Prepare for your next focused session.'
      );
    }, preAlertTimeoutMs);
    timeouts.push(preAlertTimeoutId);
    console.log(`[NotificationManager] "Get Ready" alert for "${block.title}" scheduled for ${preAlertTime.toLocaleTimeString()}`);
  }

  // --- Schedule Final Notification ---
  const endTime = new Date(startTime.getTime() + block.duration * 60000);
  const finalTimeoutMs = endTime.getTime() - now.getTime();

  if (finalTimeoutMs > 0) {
    const finalTimeoutId = window.setTimeout(() => {
      showNotification(`Time's up for "${block.title}"!`, 'Time to reflect on your task.');
      onNotify(block);
    }, finalTimeoutMs);
    timeouts.push(finalTimeoutId);
    console.log(`[NotificationManager] "Time's Up" alert for "${block.title}" scheduled for ${endTime.toLocaleTimeString()}`);
  }

  if (timeouts.length > 0) {
    notificationTimeouts.set(block.id, timeouts);
  }
}


/**
 * Displays a browser notification.
 * @param title The title of the notification.
 * @param body The body text of the notification.
 */
function showNotification(title: string, body: string) {
    if (typeof window === 'undefined' || Notification.permission !== 'granted') {
        // Fallback for when notifications are not granted
        console.log(`[Notification Fallback] ${title}: ${body}`);
        return;
    }
  
    const notification = new Notification(title, {
        body,
        icon: '/favicon.ico', // Ensure you have a favicon at this path
    });

    // Optional: handle click
    notification.onclick = () => {
        window.focus();
    };
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
