import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { capturePayPalOrder, isPayPalConfigured } from '@/lib/paypal';

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
      console.warn('Firebase Admin not fully configured; capture-order will simulate auth failure.');
    }
  } catch (e) {
    console.error('Firebase Admin init error (PayPal capture-order):', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json({ error: 'PayPal not configured' }, { status: 500 });
    }

    const { idToken, orderId } = await req.json();
    if (!idToken || !orderId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Verify Firebase ID token
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const userId = decoded.uid;

    // Capture order
    const capture = await capturePayPalOrder(orderId);

    // Verify amount and status
    const purchaseUnit = capture?.purchase_units?.[0];
    const captures = purchaseUnit?.payments?.captures || [];
    const successful = captures.some((c: any) => c.status === 'COMPLETED' && c.amount?.value === '29' && c.amount?.currency_code === 'USD');
    if (!successful) {
      return NextResponse.json({ error: 'Payment not completed or amount mismatch' }, { status: 400 });
    }

    // Mark user as Pro
    const db = getFirestore();
    await db.collection('users').doc(userId).set({ isPro: true }, { merge: true });
    await db.collection('paypal_orders').doc(orderId).set({
      userId,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      raw: capture,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PayPal capture-order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to capture order' }, { status: 500 });
  }
}


