
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    // Construct the credential object from individual environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Check if all required parts of the service account are present
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      throw new Error('Firebase Admin SDK credentials are not fully configured in environment variables.');
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully for feedback submission.');
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
  }
}

export async function POST(req: NextRequest) {
  // Ensure the Admin SDK was initialized before proceeding
  if (!getApps().length) {
    console.error('Feedback submission failed because Firebase Admin SDK is not initialized.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const { userId, feedbackType, message } = await req.json();

    if (!userId || !feedbackType || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminDb = getFirestore();
    const feedbackRef = adminDb.collection('feedback').doc();

    await feedbackRef.set({
      userId,
      feedbackType,
      message,
      createdAt: FieldValue.serverTimestamp(),
      status: 'new', // e.g., new, reviewed, archived
    });

    return NextResponse.json({ success: true, message: 'Feedback submitted successfully' });

  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    // Avoid exposing internal error details to the client
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
