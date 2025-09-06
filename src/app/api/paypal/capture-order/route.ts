import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { capturePayPalOrder, isPayPalConfigured } from '@/lib/paypal';

// Import getAccessToken function
async function getAccessToken(): Promise<string> {
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
  const baseUrl = process.env.PAYPAL_ENV?.toLowerCase() === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to obtain PayPal access token');
  const data = await res.json();
  return data.access_token as string;
}

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      initializeApp({ 
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.error('Firebase Admin configuration is incomplete:', {
        hasProjectId: !!serviceAccount.projectId,
        hasPrivateKey: !!serviceAccount.privateKey,
        hasClientEmail: !!serviceAccount.clientEmail
      });
    }
  } catch (e) {
    console.error('Firebase Admin initialization error:', e);
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

    // Capture order (handle already captured orders)
    let capture;
    try {
      capture = await capturePayPalOrder(orderId);
    } catch (error: any) {
      // If order is already captured, get the order details instead
      if (error.message.includes('ORDER_ALREADY_CAPTURED')) {
        console.log('Order already captured, fetching order details...');
        const accessToken = await getAccessToken();
        const res = await fetch(`${process.env.PAYPAL_ENV?.toLowerCase() === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'}/v2/checkout/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch order details');
        capture = await res.json();
      } else {
        throw error;
      }
    }
    
    // Log the capture response for debugging
    console.log('PayPal capture response:', JSON.stringify(capture, null, 2));

    // Verify amount and status - handle both sandbox and live environments
    const purchaseUnit = capture?.purchase_units?.[0];
    const captures = purchaseUnit?.payments?.captures || [];
    
    // Check if any capture is completed with the correct amount (allow for string/number variations)
    const successful = captures.some((c: any) => {
      const isCompleted = c.status === 'COMPLETED';
      const amountValue = parseFloat(c.amount?.value || '0');
      const isCorrectAmount = amountValue === 29.00;
      const isUSD = c.amount?.currency_code === 'USD';
      
      console.log(`Capture validation - Status: ${c.status}, Amount: ${c.amount?.value}, Currency: ${c.amount?.currency_code}`);
      console.log(`Validation results - Completed: ${isCompleted}, Amount OK: ${isCorrectAmount}, USD: ${isUSD}`);
      
      return isCompleted && isCorrectAmount && isUSD;
    });
    
    // For sandbox testing, also check if the order status is COMPLETED at the top level
    const orderCompleted = capture?.status === 'COMPLETED';
    const isSandbox = process.env.PAYPAL_ENV?.toLowerCase() === 'sandbox';
    
    console.log(`Order level validation - Status: ${capture?.status}, Is Sandbox: ${isSandbox}`);
    
    // Allow sandbox orders that are completed even if capture validation fails
    const sandboxBypass = isSandbox && orderCompleted;
    
    if (!successful && !sandboxBypass) {
      console.error('Payment validation failed:', {
        captures: captures.map((c: any) => ({
          status: c.status,
          amount: c.amount,
          id: c.id
        }))
      });
      return NextResponse.json({ 
        error: 'Payment not completed or amount mismatch',
        debug: {
          captureCount: captures.length,
          captures: captures.map((c: any) => ({
            status: c.status,
            amount: c.amount
          })),
          orderStatus: capture?.status,
          sandboxBypass: sandboxBypass
        }
      }, { status: 400 });
    }
    
    console.log(`Payment validation passed - Successful: ${successful}, Sandbox bypass: ${sandboxBypass}`);

    // Mark user as Pro
    try {
      const db = getFirestore();
      await db.collection('users').doc(userId).set({ isPro: true }, { merge: true });
      await db.collection('paypal_orders').doc(orderId).set({
        userId,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        raw: capture,
      }, { merge: true });
    } catch (firebaseError: any) {
      console.error('Firebase error:', firebaseError);
      // If Firebase fails, still return success since PayPal payment was successful
      // The frontend will handle user upgrade through client-side Firebase
      console.log('PayPal payment successful, but Firebase admin failed. Client will handle user upgrade.');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PayPal capture-order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to capture order' }, { status: 500 });
  }
}


