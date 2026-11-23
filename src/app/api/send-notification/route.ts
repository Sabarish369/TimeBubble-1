
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

export async function POST(req: NextRequest) {
  // Initialize Firebase Admin
  const { auth, db, messaging } = initializeFirebaseAdmin();
  
  if (!auth || !db || !messaging) {
    console.error('Firebase Admin not available, cannot send notifications');
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  try {
    const { userId, title, body, bubbleId, notificationType } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's FCM token from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
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
