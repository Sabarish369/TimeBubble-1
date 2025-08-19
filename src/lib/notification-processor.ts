
import { getPendingNotifications, markNotificationAsSent, ScheduledNotification } from './notification-scheduler';

/**
 * Process and send pending notifications
 */
export async function processPendingNotifications() {
  try {
    const pendingNotifications = await getPendingNotifications();
    
    if (pendingNotifications.length === 0) {
      return { processed: 0, errors: 0 };
    }

    console.log(`Processing ${pendingNotifications.length} pending notifications`);
    
    let processed = 0;
    let errors = 0;

    for (const notification of pendingNotifications) {
      try {
        await sendNotification(notification);
        await markNotificationAsSent(notification.id!);
        processed++;
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);
        errors++;
      }
    }

    console.log(`Notification processing complete: ${processed} sent, ${errors} errors`);
    return { processed, errors };
  } catch (error) {
    console.error('Error processing notifications:', error);
    return { processed: 0, errors: 1 };
  }
}

/**
 * Send a single notification
 */
async function sendNotification(notification: ScheduledNotification) {
  const { bubbleTitle, notificationType, userId, bubbleId } = notification;
  
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send notification: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Generate notification title based on type
 */
function getNotificationTitle(type: '15min' | '1min'): string {
  switch (type) {
    case '15min':
      return '⏰ Task Starting Soon';
    case '1min':
      return '🚨 Task Starting Now';
    default:
      return '📅 Task Reminder';
  }
}

/**
 * Generate notification body based on task and type
 */
function getNotificationBody(taskTitle: string, type: '15min' | '1min'): string {
  switch (type) {
    case '15min':
      return `"${taskTitle}" starts in 15 minutes. Get ready!`;
    case '1min':
      return `"${taskTitle}" starts in 1 minute. Time to begin!`;
    default:
      return `Don't forget: "${taskTitle}"`;
  }
}

/**
 * Start the notification processor (runs every minute)
 */
export function startNotificationProcessor() {
  if (typeof window !== 'undefined') {
    // Only run on client side
    const intervalId = setInterval(processPendingNotifications, 60000); // Check every minute
    
    // Also process immediately
    processPendingNotifications();
    
    return () => clearInterval(intervalId);
  }
  return () => {};
}
