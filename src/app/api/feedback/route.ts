import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { message, userId, userEmail } = await req.json();
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Feedback message is required' }, { status: 400 });
    }

    // Initialize Firebase Admin
    const { db } = getFirebaseAdmin();
    
    if (!db) {
      console.error('Firebase Admin not available, cannot save feedback');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    const feedbackData = {
      message: message.trim(),
      userId: userId || 'anonymous',
      userEmail: userEmail || 'anonymous',
      timestamp: new Date(),
      status: 'new'
    };

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
