
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

export interface ScheduledNotification {
  id?: string;
  userId: string;
  bubbleId: string;
  bubbleTitle: string;
  notificationType: '15min' | '1min' | 'completed';
  scheduledTime: Date;
  processed: boolean;
  createdAt: Date;
}

/**
 * Schedule notifications for a task bubble
 */
export async function scheduleNotificationsForBubble(
  userId: string,
  bubbleId: string,
  bubbleTitle: string,
  startTime: Date,
  duration: number = 60 // duration in minutes
): Promise<number> {
  try {
    // Clear any existing notifications for this bubble
    await clearNotificationsForBubble(bubbleId);

    const notifications: Omit<ScheduledNotification, 'id'>[] = [];
    const now = new Date();

    // 15-minute warning notification
    const fifteenMinBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
    if (fifteenMinBefore > now) {
      notifications.push({
        userId,
        bubbleId,
        bubbleTitle,
        notificationType: '15min',
        scheduledTime: fifteenMinBefore,
        processed: false,
        createdAt: now
      });
    }

    // 1-minute warning notification
    const oneMinBefore = new Date(startTime.getTime() - 1 * 60 * 1000);
    if (oneMinBefore > now) {
      notifications.push({
        userId,
        bubbleId,
        bubbleTitle,
        notificationType: '1min',
        scheduledTime: oneMinBefore,
        processed: false,
        createdAt: now
      });
    }

    // Task completed notification (after task duration)
    const completedTime = new Date(startTime.getTime() + duration * 60 * 1000);
    notifications.push({
      userId,
      bubbleId,
      bubbleTitle,
      notificationType: 'completed',
      scheduledTime: completedTime,
      processed: false,
      createdAt: now
    });

    // Save notifications to Firestore
    const notificationsRef = collection(db, 'scheduledNotifications');
    for (const notification of notifications) {
      await addDoc(notificationsRef, {
        ...notification,
        scheduledTime: Timestamp.fromDate(notification.scheduledTime),
        createdAt: Timestamp.fromDate(notification.createdAt)
      });
    }

    console.log(`Scheduled ${notifications.length} notifications for "${bubbleTitle}"`);
    return notifications.length;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    throw error;
  }
}

/**
 * Clear notifications for a specific bubble
 */
export async function clearNotificationsForBubble(bubbleId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, 'scheduledNotifications');
    const q = query(
      notificationsRef,
      where('bubbleId', '==', bubbleId),
      where('processed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'scheduledNotifications', docSnapshot.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`Cleared notifications for bubble: ${bubbleId}`);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Get pending notifications that need to be sent
 */
export async function getPendingNotifications(): Promise<ScheduledNotification[]> {
  try {
    const now = new Date();
    const notificationsRef = collection(db, 'scheduledNotifications');
    const q = query(
      notificationsRef,
      where('processed', '==', false),
      where('scheduledTime', '<=', Timestamp.fromDate(now))
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledTime: doc.data().scheduledTime.toDate(),
      createdAt: doc.data().createdAt.toDate()
    })) as ScheduledNotification[];
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
}

/**
 * Mark notification as processed
 */
export async function markNotificationAsProcessed(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'scheduledNotifications', notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error marking notification as processed:', error);
  }
}
