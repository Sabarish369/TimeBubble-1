
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

// Standardized Firebase Admin SDK initialization
if (!getApps().length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      throw new Error('Firebase Admin SDK credentials are not fully configured in environment variables.');
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully for notifications.');
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
  }
}

export async function POST(req: NextRequest) {
  if (!getApps().length) {
    console.error('Notification failed because Firebase Admin SDK is not initialized.');
    // Simulate success for development if keys are missing, to not block frontend.
    const { title, body } = await req.json();
    return NextResponse.json({ 
      success: true, 
      message: 'Notification would be sent (Admin SDK not configured)',
      simulatedPayload: { notification: { title, body } }
    });
  }

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
      // It's common for users to not have a token (e.g., they denied permission)
      // So we'll return success to avoid frontend errors.
      return NextResponse.json({ success: true, message: 'User has no FCM token, notification not sent.' });
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
    const messaging = getMessaging();
    const response = await messaging.send(message);
      
    console.log('Successfully sent notification:', response);
      
    return NextResponse.json({ 
      success: true, 
      messageId: response,
      message: 'Notification sent successfully'
    });

  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification',
      details: error.message 
    }, { status: 500 });
  }
}
