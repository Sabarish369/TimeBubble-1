import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;
let initializationAttempted = false;

function initializeFirebaseAdmin() {
  // Return existing instances if already initialized
  if (adminApp && adminDb && adminAuth) {
    return { app: adminApp, db: adminDb, auth: adminAuth };
  }

  // If we already attempted initialization and failed, don't retry
  if (initializationAttempted && (!adminApp || !adminDb || !adminAuth)) {
    console.warn('Firebase Admin initialization was previously attempted and failed');
    return { app: null, db: null, auth: null };
  }

  initializationAttempted = true;

  try {
    // Check if Firebase Admin is already initialized
    if (admin.apps.length > 0) {
      adminApp = admin.apps[0];
      adminDb = admin.firestore(adminApp!);
      adminAuth = admin.auth(adminApp!);
      console.log('Using existing Firebase Admin app');
      return { app: adminApp, db: adminDb, auth: adminAuth };
    }

    // Prepare service account credentials
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Validate required credentials
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      console.error('Firebase Admin SDK credentials are incomplete:', {
        hasProjectId: !!serviceAccount.projectId,
        hasPrivateKey: !!serviceAccount.privateKey && serviceAccount.privateKey.length > 0,
        hasClientEmail: !!serviceAccount.clientEmail,
        projectId: serviceAccount.projectId || 'MISSING',
        clientEmail: serviceAccount.clientEmail || 'MISSING'
      });
      return { app: null, db: null, auth: null };
    }

    // Initialize Firebase Admin
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.projectId
    });
    
    adminDb = admin.firestore(adminApp);
    adminAuth = admin.auth(adminApp);
    
    console.log('Firebase Admin SDK initialized successfully for project:', serviceAccount.projectId);
    return { app: adminApp, db: adminDb, auth: adminAuth };
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // Reset variables on error
    adminApp = null;
    adminDb = null;
    adminAuth = null;
    
    return { app: null, db: null, auth: null };
  }
}

// Helper function to safely get Firebase Admin services
export function getFirebaseAdmin() {
  return initializeFirebaseAdmin();
}

// Export individual services with lazy initialization
export function getAdminApp() {
  const { app } = getFirebaseAdmin();
  return app;
}

export function getAdminDb() {
  const { db } = getFirebaseAdmin();
  return db;
}

export function getAdminAuth() {
  const { auth } = getFirebaseAdmin();
  return auth;
}

// Legacy exports for backward compatibility - use different names to avoid conflicts
export const legacyAdminApp = getAdminApp;
export const legacyAdminDb = getAdminDb;
export const legacyAdminAuth = getAdminAuth;
