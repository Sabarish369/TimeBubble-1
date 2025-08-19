
import { doc, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

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
) {
  try {
    // Clear existing notifications for this bubble
    await clearNotificationsForBubble(bubbleId);

    const now = new Date();
    const notifications: Omit<ScheduledNotification, 'id'>[] = [];

    // Schedule 15-minute notification
    const fifteenMinBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
    if (fifteenMinBefore > now) {
      notifications.push({
        userId,
        bubbleId,
        bubbleTitle,
        scheduledTime: fifteenMinBefore,
        notificationType: '15min',
        sent: false
      });
    }

    // Schedule 1-minute notification
    const oneMinBefore = new Date(startTime.getTime() - 1 * 60 * 1000);
    if (oneMinBefore > now) {
      notifications.push({
        userId,
        bubbleId,
        bubbleTitle,
        scheduledTime: oneMinBefore,
        notificationType: '1min',
        sent: false
      });
    }

    // Save notifications to Firestore
    const notificationsRef = collection(db, 'scheduledNotifications');
    for (const notification of notifications) {
      await addDoc(notificationsRef, {
        ...notification,
        scheduledTime: Timestamp.fromDate(notification.scheduledTime)
      });
    }

    console.log(`Scheduled ${notifications.length} notifications for bubble: ${bubbleTitle}`);
    return notifications.length;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    throw error;
  }
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
