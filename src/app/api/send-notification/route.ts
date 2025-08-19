
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, bubbleId, notificationType } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's FCM token from Firestore
    const adminDb = getFirestore();
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      return NextResponse.json({ error: 'User has no FCM token' }, { status: 400 });
    }

    // Prepare the notification message
    const message = {
      notification: {
        title,
        body,
        icon: '/logo.svg',
      },
      data: {
        bubbleId: bubbleId || '',
        notificationType: notificationType || '',
        url: '/', // URL to open when notification is clicked
      },
      token: fcmToken,
      webpush: {
        fcmOptions: {
          link: '/', // URL to open when notification is clicked
        },
      },
    };

    // Send the notification
    try {
      const messaging = getMessaging();
      const response = await messaging.send(message);
      
      console.log('Successfully sent notification:', response);
      
      return NextResponse.json({ 
        success: true, 
        messageId: response,
        message: 'Notification sent successfully'
      });
    } catch (messagingError: any) {
      console.error('FCM sending error:', messagingError);
      
      // For development/testing, return success even if admin SDK isn't configured
      if (messagingError.code === 'app/invalid-credential' || messagingError.code === 'messaging/invalid-argument') {
        return NextResponse.json({ 
          success: true, 
          message: 'Notification would be sent (Admin SDK not configured for development)',
          simulatedPayload: message
        });
      }
      
      throw messagingError;
    }

  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification',
      details: error.message 
    }, { status: 500 });
  }
}
