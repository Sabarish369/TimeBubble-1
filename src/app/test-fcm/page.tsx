
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import * as NotificationManager from '@/lib/notification-manager';
import { getMessaging, getToken } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { urlBase64ToUint8Array } from '@/lib/utils';

export default function TestFCMPage() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      addTestResult(`Permission result: ${permission}`);
    } catch (error) {
      addTestResult(`Permission error: ${error}`);
    }
  };

  const testGetFCMToken = async () => {
    if (!user) {
      addTestResult('Error: User not logged in');
      return;
    }

    try {
      const messaging = getMessaging(app);
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        addTestResult('Error: VAPID key missing');
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: vapidKey,
      });

      if (token) {
        setFcmToken(token);
        addTestResult('FCM Token obtained successfully');
        addTestResult(`Token: ${token.substring(0, 50)}...`);
      } else {
        addTestResult('No FCM token available');
      }
    } catch (error) {
      addTestResult(`FCM Token error: ${error}`);
    }
  };

  const testServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        addTestResult('Service Worker registered successfully');
        addTestResult(`SW State: ${registration.active?.state || 'not active'}`);
      } catch (error) {
        addTestResult(`Service Worker error: ${error}`);
      }
    } else {
      addTestResult('Service Worker not supported');
    }
  };

  const testBrowserNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from your browser',
        icon: '/logo.svg',
      });
      addTestResult('Browser notification sent');
    } else {
      addTestResult('Cannot send browser notification - permission required');
    }
  };

  const sendTestFCMMessage = async () => {
    if (!fcmToken || !user) {
      addTestResult('Error: No FCM token or user available');
      return;
    }

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          title: '🧪 Test Notification',
          body: 'This is a test FCM notification from your task scheduler!',
          bubbleId: 'test-bubble',
          notificationType: 'test',
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        addTestResult('✅ Test FCM message sent successfully');
        addTestResult(`Result: ${result.message}`);
      } else {
        addTestResult(`❌ FCM send failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`FCM send error: ${error}`);
    }
  };

  const testNotificationScheduling = async () => {
    if (!user) {
      addTestResult('Error: User not logged in');
      return;
    }

    try {
      const { scheduleNotificationsForBubble } = await import('@/lib/notification-scheduler');
      
      // Create a test task starting in 2 minutes
      const testStartTime = new Date(Date.now() + 2 * 60 * 1000);
      
      const count = await scheduleNotificationsForBubble(
        user.uid,
        'test-bubble-' + Date.now(),
        'Test Task Scheduling',
        testStartTime
      );
      
      addTestResult(`✅ Scheduled ${count} test notifications`);
      addTestResult(`Task starts at: ${testStartTime.toLocaleTimeString()}`);
      addTestResult('Note: Notifications will be processed by the background service');
    } catch (error) {
      addTestResult(`Scheduling error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Firebase Cloud Messaging Test</CardTitle>
          <CardDescription>
            Test your FCM setup and troubleshoot any issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Current Status</h3>
              <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
              <p>Notification Permission: {permissionStatus}</p>
              <p>Service Worker: {typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'Supported' : 'Not supported'}</p>
              <p>FCM Token: {fcmToken ? 'Available' : 'Not available'}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Test Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={testNotificationPermission} variant="outline">
                  Test Notification Permission
                </Button>
                <Button onClick={testServiceWorker} variant="outline">
                  Test Service Worker
                </Button>
                <Button onClick={testGetFCMToken} variant="outline">
                  Get FCM Token
                </Button>
                <Button onClick={testBrowserNotification} variant="outline">
                  Send Test Browser Notification
                </Button>
                <Button onClick={sendTestFCMMessage} variant="outline">
                  Send Test FCM Message
                </Button>
                <Button onClick={testNotificationScheduling} variant="outline">
                  Test Notification Scheduling
                </Button>
                <Button onClick={clearResults} variant="ghost">
                  Clear Results
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Test Results</h3>
            <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">No test results yet. Click the buttons above to run tests.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="font-mono text-sm mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Testing Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>First, test notification permission</li>
              <li>Test service worker registration</li>
              <li>Get FCM token (requires being logged in)</li>
              <li>Send a test browser notification</li>
              <li>For backend FCM testing, you'll need to use the FCM token with Firebase Admin SDK</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
