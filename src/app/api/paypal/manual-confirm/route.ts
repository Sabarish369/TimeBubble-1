import { NextRequest, NextResponse } from 'next/server';
import { safeVerifyIdToken, safeUpgradeUserToPro, safeLogPaymentEvent, isFirebaseAdminConfigured } from '@/lib/firebase-utils';


export async function POST(req: NextRequest) {
  try {
    const { idToken, transactionId, amount } = await req.json();
    if (!idToken || !transactionId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check Firebase Admin configuration
    if (!isFirebaseAdminConfigured()) {
      console.error('Firebase Admin not properly configured');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    // Verify Firebase ID token
    const userAuth = await safeVerifyIdToken(idToken);
    if (!userAuth) {
      console.error('Firebase Auth verification failed');
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    const userId = userAuth.uid;
    // Log manual confirmation event
    await safeLogPaymentEvent('paypal_manual_confirmation', {
      userId,
      transactionId,
      amount: amount || null
    });

    // Upgrade user to Pro
    const upgradeSuccess = await safeUpgradeUserToPro(userId, {
      transactionId,
      provider: 'paypal_manual',
      amount: amount || null,
      status: 'MANUAL_CONFIRMED'
    });
    
    if (!upgradeSuccess) {
      console.error('Failed to upgrade user to Pro after manual confirmation');
      return NextResponse.json({ error: 'Failed to process upgrade' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Manual confirmation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit confirmation' }, { status: 500 });
  }
}


