import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    } as any;
    
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      initializeApp({ credential: cert(serviceAccount) });
      console.log('Firebase Admin SDK initialized successfully for feedback.');
    } else {
      console.error('Firebase Admin credentials missing:', {
        hasProjectId: !!serviceAccount.projectId,
        hasPrivateKey: !!serviceAccount.privateKey,
        hasClientEmail: !!serviceAccount.clientEmail
      });
    }
  } catch (e) {
    console.error('Firebase Admin init error (feedback):', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, userId, userEmail } = await req.json();
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Feedback message is required' }, { status: 400 });
    }

    const feedbackData = {
      message: message.trim(),
      userId: userId || 'anonymous',
      userEmail: userEmail || 'anonymous',
      timestamp: new Date(),
      status: 'new'
    };

    const db = getFirestore();
    await db.collection('feedback').add(feedbackData);

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your feedback!' 
    });

  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit feedback. Please try again.' 
    }, { status: 500 });
  }
}
