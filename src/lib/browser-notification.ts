
/**
 * Browser notification service for immediate local notifications
 * This bypasses FCM issues and uses the native Notification API
 */

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

/**
 * Request notification permission and show immediate browser notification
 */
export async function showBrowserNotification(options: BrowserNotificationOptions): Promise<boolean> {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  // Request permission if not already granted
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission === 'granted') {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.svg',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      badge: '/logo.svg',
    });

    // Auto-close after 5 seconds unless requireInteraction is true
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    // Handle click to focus the app
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } else {
    console.warn('Notification permission denied');
    return false;
  }
}

/**
 * Show a "get ready" notification for an upcoming task
 */
export function showGetReadyNotification(taskTitle: string, minutesUntilStart: number): Promise<boolean> {
  const title = minutesUntilStart <= 1 
    ? '🚨 Task Starting Now!' 
    : `⏰ Task Starting in ${minutesUntilStart} minute${minutesUntilStart === 1 ? '' : 's'}`;
  
  const body = minutesUntilStart <= 1
    ? `"${taskTitle}" is starting now. Time to begin!`
    : `"${taskTitle}" starts in ${minutesUntilStart} minute${minutesUntilStart === 1 ? '' : 's'}. Get ready!`;

  return showBrowserNotification({
    title,
    body,
    tag: `task-start-${taskTitle}`, // Prevents duplicate notifications
    requireInteraction: minutesUntilStart <= 1, // Make 1-minute warning persistent
  });
}

/**
 * Show a task completion notification
 */
export function showTaskCompletionNotification(taskTitle: string): Promise<boolean> {
  return showBrowserNotification({
    title: '✅ Task Completed!',
    body: `Great job completing "${taskTitle}"! Time to reflect.`,
    tag: `completed-${taskTitle}`,
    requireInteraction: true,
  });
}


/**
 * Check if browser notifications are available and permitted
 */
export function canShowBrowserNotifications(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
