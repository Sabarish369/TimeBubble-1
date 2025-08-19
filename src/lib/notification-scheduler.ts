import { doc, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { showGetReadyNotification, canShowBrowserNotifications } from './browser-notification';

export interface ScheduledNotification {
  id?: string;
  userId: string;
  bubbleId: string;
  bubbleTitle: string;
  scheduledTime: Date;
  notificationType: '15min' | '1min';
  sent: boolean;
}

/**
 * Schedule notifications for a time bubble
 */
export async function scheduleNotificationsForBubble(
  userId: string,
  bubbleId: string,
  bubbleTitle: string,
  startTime: Date
): Promise<number> {
  const notifications: Omit<ScheduledNotification, 'id'>[] = [];
  let scheduledCount = 0;

  // 15-minute warning
  const fifteenMinBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
  if (fifteenMinBefore > new Date()) {
    notifications.push({
      userId,
      bubbleId,
      bubbleTitle,
      notificationType: '15min',
      scheduledTime: Timestamp.fromDate(fifteenMinBefore),
      sent: false,
    });

    // Schedule immediate browser notification for 15-min warning
    if (canShowBrowserNotifications()) {
      const timeUntilNotification = fifteenMinBefore.getTime() - Date.now();
      if (timeUntilNotification > 0) {
        setTimeout(() => {
          showGetReadyNotification(bubbleTitle, 15);
        }, timeUntilNotification);
        scheduledCount++;
      }
    }
  }

  // 1-minute warning
  const oneMinBefore = new Date(startTime.getTime() - 1 * 60 * 1000);
  if (oneMinBefore > new Date()) {
    notifications.push({
      userId,
      bubbleId,
      bubbleTitle,
      notificationType: '1min',
      scheduledTime: Timestamp.fromDate(oneMinBefore),
      sent: false,
    });

    // Schedule immediate browser notification for 1-min warning
    if (canShowBrowserNotifications()) {
      const timeUntilNotification = oneMinBefore.getTime() - Date.now();
      if (timeUntilNotification > 0) {
        setTimeout(() => {
          showGetReadyNotification(bubbleTitle, 1);
        }, timeUntilNotification);
        scheduledCount++;
      }
    }
  }

  // Save to Firestore (as backup/for other devices)
  for (const notification of notifications) {
    await addDoc(collection(db, 'scheduledNotifications'), notification);
  }

  console.log(`Scheduled ${scheduledCount} immediate browser notifications for "${bubbleTitle}"`);
  return notifications.length;
}

/**
 * Clear all notifications for a specific bubble
 */
export async function clearNotificationsForBubble(bubbleId: string) {
  try {
    const notificationsRef = collection(db, 'scheduledNotifications');
    const q = query(notificationsRef, where('bubbleId', '==', bubbleId));
    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log(`Cleared notifications for bubble: ${bubbleId}`);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Get pending notifications that should be sent now
 */
export async function getPendingNotifications(): Promise<ScheduledNotification[]> {
  try {
    const now = new Date();
    const notificationsRef = collection(db, 'scheduledNotifications');
    const q = query(
      notificationsRef,
      where('sent', '==', false),
      where('scheduledTime', '<=', Timestamp.fromDate(now))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledTime: doc.data().scheduledTime.toDate()
    })) as ScheduledNotification[];
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
}

/**
 * Mark notification as sent
 */
export async function markNotificationAsSent(notificationId: string) {
  try {
    const notificationRef = doc(db, 'scheduledNotifications', notificationId);
    await deleteDoc(notificationRef); // Remove sent notifications to keep collection clean
  } catch (error) {
    console.error('Error marking notification as sent:', error);
  }
}