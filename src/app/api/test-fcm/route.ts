
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, title, body } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    // For testing purposes, we'll simulate sending an FCM message
    // In production, you'd use Firebase Admin SDK here
    
    // Example of what the Admin SDK call would look like:
    /*
    const admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          // Your service account key here
        })
      });
    }

    const message = {
      notification: {
        title: title || 'Test Notification',
        body: body || 'This is a test FCM message',
      },
      token: token,
    };

    const response = await admin.messaging().send(message);
    */

    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      message: 'FCM test endpoint working (Admin SDK not configured)',
      simulatedPayload: {
        notification: {
          title: title || 'Test Notification',
          body: body || 'This is a test FCM message',
        },
        token: token.substring(0, 20) + '...'
      }
    });

  } catch (error) {
    console.error('FCM test error:', error);
    return NextResponse.json({ 
      error: 'Failed to send FCM message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
