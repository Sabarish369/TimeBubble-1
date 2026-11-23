import { getFirebaseAdmin } from './firebase-admin';

/**
 * Safely executes Firebase Admin operations with error handling
 * Returns null if Firebase is not available, allowing graceful degradation
 */
export async function safeFirebaseOperation<T>(
  operation: (db: FirebaseFirestore.Firestore, auth: any) => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    const { db, auth } = getFirebaseAdmin();
    
    if (!db || !auth) {
      console.warn('Firebase Admin not available, operation skipped');
      return fallback || null;
    }
    
    return await operation(db, auth);
  } catch (error: any) {
    console.error('Firebase operation failed:', error);
    return fallback || null;
  }
}

/**
 * Safely verifies a Firebase ID token
 */
export async function safeVerifyIdToken(idToken: string): Promise<{ uid: string } | null> {
  return safeFirebaseOperation(async (db, auth) => {
    const decoded = await auth.verifyIdToken(idToken);
    return { uid: decoded.uid };
  });
}

/**
 * Safely updates user to Pro status
 */
export async function safeUpgradeUserToPro(userId: string, orderData?: any): Promise<boolean> {
  const result = await safeFirebaseOperation(async (db) => {
    await db.collection('users').doc(userId).set({ isPro: true }, { merge: true });
    
    if (orderData) {
      await db.collection('payment_orders').add({
        userId,
        ...orderData,
        completedAt: new Date().toISOString(),
      });
    }
    
    return true;
  });
  
  return result === true;
}

/**
 * Safely logs payment events for debugging
 */
export async function safeLogPaymentEvent(eventType: string, data: any): Promise<void> {
  await safeFirebaseOperation(async (db) => {
    await db.collection('payment_logs').add({
      eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Check if Firebase Admin is properly configured
 */
export function isFirebaseAdminConfigured(): boolean {
  const { auth, db } = getFirebaseAdmin();
  return !!(auth && db);
}
