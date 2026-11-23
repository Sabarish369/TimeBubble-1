import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder, isPayPalConfigured } from '@/lib/paypal';
import { safeVerifyIdToken, safeLogPaymentEvent, isFirebaseAdminConfigured } from '@/lib/firebase-utils';


export async function POST(req: NextRequest) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json({ error: 'PayPal not configured' }, { status: 500 });
    }

    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 401 });

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

    // Get the origin from request headers
    const origin = req.headers.get('origin') || req.headers.get('host') ? `https://${req.headers.get('host')}` : undefined;

    // Create order for $29 USD Lifetime Pro
    const { id, approvalUrl } = await createPayPalOrder({
      amount: '29',
      currency: 'USD',
      description: 'TimeBubble Lifetime Pro',
      referenceId: userId,
      origin,
    });

    // Log payment event
    await safeLogPaymentEvent('paypal_order_created', {
      orderId: id,
      userId,
      amount: '29',
      currency: 'USD'
    });

    return NextResponse.json({ orderId: id, approvalUrl });
  } catch (error: any) {
    console.error('PayPal create-order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}


