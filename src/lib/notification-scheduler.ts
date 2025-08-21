
import type { TimeBlock } from '@/types';
import { showGetReadyNotification, showTaskCompletionNotification } from './browser-notification';

const scheduledNotifications = new Map<string, NodeJS.Timeout[]>();

/**
 * Clear any scheduled notifications for a specific block.
 */
export function clearScheduledNotifications(blockId: string) {
  if (scheduledNotifications.has(blockId)) {
    scheduledNotifications.get(blockId)?.forEach(clearTimeout);
    scheduledNotifications.delete(blockId);
  }
}

/**
 * Schedule all necessary notifications for a given time block.
 */
export function scheduleNotificationsForBlock(block: TimeBlock) {
  // First, clear any existing notifications for this block to avoid duplicates
  clearScheduledNotifications(block.id);

  const now = Date.now();
  const startTime = new Date(block.startTime).getTime();
  const endTime = startTime + block.duration * 60 * 1000;
  const timeouts: NodeJS.Timeout[] = [];

  const schedule = (ms: number, callback: () => void) => {
    if (ms > 0) {
      timeouts.push(setTimeout(callback, ms));
    }
  };

  // --- Schedule "Get Ready" notifications ---
  // 15 minutes before
  schedule(startTime - now - 15 * 60 * 1000, () => {
    showGetReadyNotification(block.title, 15);
  });

  // 1 minute before
  schedule(startTime - now - 1 * 60 * 1000, () => {
    showGetReadyNotification(block.title, 1);
  });
  
  // At start time
  schedule(startTime - now, () => {
    showGetReadyNotification(block.title, 0);
  });

  // --- Schedule "Task Ended" notification ---
  schedule(endTime - now, () => {
    showTaskCompletionNotification(block.title);
  });

  if (timeouts.length > 0) {
    scheduledNotifications.set(block.id, timeouts);
  }
}
