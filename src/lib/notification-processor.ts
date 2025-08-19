
import { getPendingNotifications, markNotificationAsProcessed, type ScheduledNotification } from './notification-scheduler';
import { showGetReadyNotification, canShowBrowserNotifications } from './browser-notification';

/**
 * Process all pending notifications
 */
export async function processPendingNotifications(): Promise<void> {
  try {
    const pendingNotifications = await getPendingNotifications();
    
    if (pendingNotifications.length === 0) {
      return;
    }

    console.log(`Processing ${pendingNotifications.length} pending notifications`);

    for (const notification of pendingNotifications) {
      try {
        await sendNotification(notification);
        if (notification.id) {
          await markNotificationAsProcessed(notification.id);
        }
      } catch (error) {
        console.error(`Failed to send notification for ${notification.bubbleTitle}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing pending notifications:', error);
  }
}

/**
 * Send a single notification
 */
async function sendNotification(notification: ScheduledNotification): Promise<void> {
  const { bubbleTitle, notificationType, userId, bubbleId } = notification;
  
  try {
    // Try FCM first
    const title = getNotificationTitle(notificationType);
    const body = getNotificationBody(bubbleTitle, notificationType);

    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        body,
        bubbleId,
        notificationType,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ FCM notification sent for "${bubbleTitle}" (${notificationType})`);
      return;
    }
  } catch (error) {
    console.warn('FCM notification failed, trying browser notification:', error);
  }

  // Fallback to browser notification
  if (canShowBrowserNotifications()) {
    const success = await sendBrowserNotification(bubbleTitle, notificationType);
    
    if (success) {
      console.log(`✅ Browser notification sent for "${bubbleTitle}" (${notificationType})`);
      return;
    }
  }

  throw new Error('Both FCM and browser notifications failed');
}

/**
 * Send browser notification as fallback
 */
async function sendBrowserNotification(taskTitle: string, type: '15min' | '1min' | 'completed'): Promise<boolean> {
  try {
    const title = getNotificationTitle(type);
    const body = getNotificationBody(taskTitle, type);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.svg',
        tag: `task-${type}`, // Prevents duplicate notifications
        requireInteraction: type === '1min' || type === 'completed', // Keep important notifications visible
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Browser notification error:', error);
    return false;
  }
}

/**
 * Generate notification title based on type
 */
function getNotificationTitle(type: '15min' | '1min' | 'completed'): string {
  switch (type) {
    case '15min':
      return '⏰ Task Starting Soon';
    case '1min':
      return '🚨 Task Starting Now';
    case 'completed':
      return '✅ Task Completed';
    default:
      return '📅 Task Reminder';
  }
}

/**
 * Generate notification body based on task and type
 */
function getNotificationBody(taskTitle: string, type: '15min' | '1min' | 'completed'): string {
  switch (type) {
    case '15min':
      return `"${taskTitle}" starts in 15 minutes. Get ready!`;
    case '1min':
      return `"${taskTitle}" starts in 1 minute. Time to begin!`;
    case 'completed':
      return `Great job! You've completed "${taskTitle}". Time for a break or your next task.`;
    default:
      return `Don't forget: "${taskTitle}"`;
  }
}

/**
 * Start the notification processor (runs every minute)
 */
export function startNotificationProcessor(): (() => void) | undefined {
  if (typeof window !== 'undefined') {
    // Only run on client side
    const intervalId = setInterval(processPendingNotifications, 60000); // Check every minute
    
    // Also process immediately
    processPendingNotifications();
    
    return () => clearInterval(intervalId);
  }
  return undefined;
}
