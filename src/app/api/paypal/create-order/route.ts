import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createPayPalOrder, isPayPalConfigured } from '@/lib/paypal';

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
      console.warn('Firebase Admin not fully configured; create-order will simulate auth failure.');
    }
  } catch (e) {
    console.error('Firebase Admin init error (PayPal create-order):', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json({ error: 'PayPal not configured' }, { status: 500 });
    }

    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 401 });

    // Verify Firebase ID token
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const userId = decoded.uid;

    // Create order for $29 USD Lifetime Pro
    const { id, approvalUrl } = await createPayPalOrder({
      amount: '29',
      currency: 'USD',
      description: 'TimeBubble Lifetime Pro',
      referenceId: userId,
    });

    // Optionally write a pending order record
    try {
      const db = getFirestore();
      await db.collection('paypal_orders').doc(id).set({
        userId,
        status: 'CREATED',
        createdAt: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({ orderId: id, approvalUrl });
  } catch (error: any) {
    console.error('PayPal create-order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}


