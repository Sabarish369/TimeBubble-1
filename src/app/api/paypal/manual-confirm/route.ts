import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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
    } else {
      console.warn('Firebase Admin not fully configured; manual-confirm will fail auth.');
    }
  } catch (e) {
    console.error('Firebase Admin init error (manual-confirm):', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, transactionId, amount } = await req.json();
    if (!idToken || !transactionId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const db = getFirestore();
    // Store proof for manual review
    await db.collection('paypal_manual_reviews').add({
      userId,
      transactionId,
      amount: amount || null,
      createdAt: new Date().toISOString(),
      status: 'SUBMITTED',
    });

    // Immediately grant Pro (optional). Remove this if you prefer admin approval first.
    await db.collection('users').doc(userId).set({ isPro: true }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Manual confirmation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit confirmation' }, { status: 500 });
  }
}


