
'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { requestNotificationPermission, canShowBrowserNotifications, showBrowserNotification } from '@/lib/browser-notification';
import { scheduleNotificationsForBlock, clearScheduledNotifications } from '@/lib/notification-scheduler';
import type { TimeBlock } from '@/types';


export function useNotifications() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize notification system
  useEffect(() => {
    if (!user || isInitialized) return;

    const initialize = async () => {
        console.log('🔔 Initializing notification system...');
        try {
            const hasPermission = canShowBrowserNotifications();
            if (hasPermission) {
                console.log('✅ Browser notifications are working!');
            } else {
                console.log('🤔 Requesting notification permission...');
                const granted = await requestNotificationPermission();
                 if (granted) {
                     console.log('✅ Permission granted!');
                 } else {
                     console.warn('🚨 Permission denied. Notifications will not be shown.');
                 }
            }
            setIsInitialized(true);
            console.log('✅ Notification system fully initialized');
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
        }
    };
    initialize();
    
  }, [user, isInitialized]);

  const scheduleTaskNotifications = useCallback(async (block: TimeBlock) => {
    if (!isInitialized) return;
    try {
      scheduleNotificationsForBlock(block);
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  }, [isInitialized]);

  const clearTaskNotifications = useCallback(async (blockId: string) => {
    try {
      clearScheduledNotifications(blockId);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, []);

  return {
    scheduleTaskNotifications,
    clearTaskNotifications,
    isReady: isInitialized,
  };
}
