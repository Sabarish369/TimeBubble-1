
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { startNotificationProcessor } from '@/lib/notification-processor';
import { requestPermissionAndGetToken, setupForegroundMessageListener } from '@/lib/notification-manager';
import { scheduleNotificationsForBubble, clearNotificationsForBubble } from '@/lib/notification-scheduler';

export function useNotifications() {
  const { user } = useAuth();

  // Initialize FCM and start notification processor
  useEffect(() => {
    if (!user) return;

    let cleanup: (() => void) | undefined;

    const initializeNotifications = async () => {
      try {
        // Request FCM permission and get token
        await requestPermissionAndGetToken(user.uid);
        
        // Setup foreground message listener
        setupForegroundMessageListener();
        
        // Start the notification processor
        cleanup = startNotificationProcessor();
        
        console.log('✅ Notification system initialized');
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [user]);

  // Function to schedule notifications for a task
  const scheduleTaskNotifications = useCallback(async (
    bubbleId: string,
    bubbleTitle: string,
    startTime: Date,
    duration: number = 60
  ) => {
    if (!user) {
      console.warn('Cannot schedule notifications: user not logged in');
      return;
    }

    try {
      const count = await scheduleNotificationsForBubble(
        user.uid,
        bubbleId,
        bubbleTitle,
        startTime,
        duration
      );
      console.log(`✅ Scheduled ${count} notifications for "${bubbleTitle}"`);
      return count;
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      throw error;
    }
  }, [user]);

  // Function to clear notifications for a task
  const clearTaskNotifications = useCallback(async (bubbleId: string) => {
    try {
      await clearNotificationsForBubble(bubbleId);
      console.log(`✅ Cleared notifications for bubble: ${bubbleId}`);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, []);

  return {
    scheduleTaskNotifications,
    clearTaskNotifications,
    isReady: !!user
  };
}
