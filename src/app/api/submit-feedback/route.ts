import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Add this to verify the route is being loaded
console.log('Feedback API route loaded');

// Firebase Admin SDK initialization state
let firebaseInitialized = false;
let firebaseInitError = null;

function initializeFirebase() {
  try {
    console.log('Starting Firebase initialization...');
    
    // Check if already initialized
    if (getApps().length > 0) {
      console.log('Firebase already initialized, using existing instance');
      firebaseInitialized = true;
      return true;
    }

    let serviceAccount;

    // Log environment variables for debugging (without sensitive data)
    console.log('Environment variables check:');
    console.log('- FIREBASE_ADMIN_CONFIG exists:', !!process.env.FIREBASE_ADMIN_CONFIG);
    console.log('- FIREBASE_PROJECT_ID exists:', !!process.env.FIREBASE_PROJECT_ID);
    console.log('- FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    console.log('- FIREBASE_CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);

    // Check if we have the JSON config format (in FIREBASE_ADMIN_CONFIG)
    if (process.env.FIREBASE_ADMIN_CONFIG) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);
        console.log('Using Firebase config from FIREBASE_ADMIN_CONFIG JSON');
        console.log('Parsed service account keys:', Object.keys(serviceAccount));
      } catch (parseError) {
        console.error('Failed to parse FIREBASE_ADMIN_CONFIG JSON:', parseError);
        serviceAccount = null;
      }
    }

    // If JSON config failed or doesn't exist, try individual environment variables
    if (!serviceAccount) {
      console.log('Falling back to individual environment variables');
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
      console.log('Individual env vars - projectId:', !!serviceAccount.projectId);
      console.log('Individual env vars - hasPrivateKey:', !!serviceAccount.privateKey);
      console.log('Individual env vars - clientEmail:', !!serviceAccount.clientEmail);
      
      // Handle private key formatting
      if (serviceAccount.privateKey) {
        // Replace escaped newlines with actual newlines
        serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, '\n');
        console.log('Formatted private key length:', serviceAccount.privateKey.length);
      }
    }
    
    // Validate required environment variables
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      const error = 'Firebase Admin SDK credentials are not fully configured in environment variables.';
      console.error(error);
      console.error('Current service account config:', {
        projectId: !!serviceAccount.projectId,
        hasPrivateKey: !!serviceAccount.privateKey,
        privateKeyLength: serviceAccount.privateKey ? serviceAccount.privateKey.length : 0,
        hasClientEmail: !!serviceAccount.clientEmail
      });
      firebaseInitError = error;
      return false;
    }

    console.log('Initializing Firebase app...');
    initializeApp({
      credential: cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully for feedback submission.');
    return true;
  } catch (error: any) {
    const errorMessage = `Firebase Admin initialization error: ${error.message}`;
    console.error(errorMessage);
    console.error('Error stack:', error.stack);
    firebaseInitError = errorMessage;
    return false;
  }
}

export async function POST(req: NextRequest) {
  console.log('Feedback API POST called');
  
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { userId, feedbackType, message } = body;
    console.log('Request data:', { userId: !!userId, feedbackType, message: message ? `${message.substring(0, 20)}...` : null });

    // Validate required fields
    if (!userId || !feedbackType || !message) {
      console.error('Missing required fields:', { userId: !!userId, feedbackType: !!feedbackType, message: !!message });
      return NextResponse.json({ 
        error: 'Missing required fields: userId, feedbackType, and message are all required' 
      }, { status: 400 });
    }

    // Ensure Firebase is properly initialized
    console.log('Checking Firebase initialization status:', firebaseInitialized);
    if (!firebaseInitialized) {
      console.log('Firebase not initialized, attempting initialization...');
      // Try to initialize again
      const initSuccess = initializeFirebase();
      console.log('Firebase initialization result:', initSuccess);
      if (!initSuccess) {
        const errorMsg = firebaseInitError || 'Firebase Admin SDK failed to initialize. Feedback system is temporarily unavailable.';
        console.error('Firebase initialization failed:', errorMsg);
        return NextResponse.json({ 
          error: errorMsg
        }, { status: 503 });
      }
    }

    // Get Firestore instance
    let adminDb;
    try {
      console.log('Getting Firestore instance...');
      adminDb = getFirestore();
      console.log('Firestore instance obtained successfully');
    } catch (firestoreError: any) {
      console.error('Failed to get Firestore instance:', firestoreError);
      return NextResponse.json({ 
        error: 'Database connection failed. Please try again later.' 
      }, { status: 503 });
    }

    // Create feedback document
    console.log('Creating feedback document...');
    const feedbackRef = adminDb.collection('feedback').doc();

    await feedbackRef.set({
      userId,
      feedbackType,
      message,
      createdAt: FieldValue.serverTimestamp(),
      status: 'new',
    });
    
    console.log('Feedback document created successfully');

    return NextResponse.json({ success: true, message: 'Feedback submitted successfully' });

  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      return NextResponse.json({ 
        error: 'Permission denied. Please contact support if this issue persists.' 
      }, { status: 403 });
    }
    
    if (error.code === 'unavailable') {
      return NextResponse.json({ 
        error: 'Database unavailable. Please try again in a few minutes.' 
      }, { status: 503 });
    }
    
    // Generic error response - ensure we always return JSON
    return NextResponse.json({ 
      error: 'Failed to submit feedback. Please try again later.' 
    }, { status: 500 });
  }
}

// Add a GET method for testing purposes
export async function GET() {
  console.log('Feedback API GET called (for testing)');
  return NextResponse.json({ message: 'Feedback API is working' });
}