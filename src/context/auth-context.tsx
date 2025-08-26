
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
 signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import type { UserPreferences } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isPro: boolean;
  isNewUser: boolean;
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const setLoginCookie = (loggedIn: boolean) => {
    if (typeof window !== 'undefined') {
      document.cookie = `firebase-auth-logged-in=${loggedIn}; path=/; max-age=${loggedIn ? 30 * 24 * 60 * 60 : 0}`;
    }
  };
  
  const refreshUserStatus = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setIsPro(!!data.isPro);
        setGeminiApiKeyState(data.geminiApiKey || null);
      }
    }
  }, []);

  // The handleUserChange function needs to be defined outside or hoisted
  const handleUserChange = useCallback( (user: User | null) => {
    setLoading(true);
    setUser(user);
    setLoginCookie(!!user);
    if (user) {
      if (user.metadata.creationTime) {
        const creationDate = new Date(user.metadata.creationTime);
        const now = new Date();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        setIsNewUser(now.getTime() - creationDate.getTime() < sevenDays);
      } else {
        setIsNewUser(false);
      }

      // Set up a real-time listener for the user document
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsPro(!!data.isPro);
          // Check if geminiApiKey is null or undefined before setting state
          setGeminiApiKeyState(data.geminiApiKey || null);
        } else {
          // New user, create their doc
          setDoc(userDocRef, { email: user.email, displayName: user.displayName, isPro: false }, { merge: true });
          setIsPro(false);
          setGeminiApiKeyState(null);
        }
        setLoading(false);
      }, (error) => {
          console.error("Firestore user data listener error:", error);
          if (error.code === 'permission-denied') {
              toast({
                  title: 'Permission Error',
                  description: "Your security rules are preventing access to user data. Please check your Firestore rules.",
                  variant: 'destructive',
                  duration: 10000,
              });
          }
          setLoading(false);
      });
      return unsubscribe;

    } else {
      // User logged out, clear state
      setIsPro(false);
      setIsNewUser(false);
      setGeminiApiKeyState(null);
      setLoading(false);
      return () => {};
    }
  }, [toast]);


  useEffect(() => {
    if (!auth || !Object.keys(auth).length) {
      setError("Firebase is not configured. Please add your NEXT_PUBLIC_FIREBASE_ keys to the .env file.");
      setLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      handleUserChange(user);
    });
    return () => unsubscribeAuth();

  }, [handleUserChange]);

  const handleAuthError = (err: any) => {
    let message = 'An unknown error occurred.';
    if (err.code) {
        switch (err.code) {
            case 'auth/popup-closed-by-user':
            case 'auth/cancelled-popup-request':
                return; 
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
                message = 'Invalid email or password. Please try again.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password. Please try again.';
                break;
            case 'auth/email-already-in-use':
                message = 'An account with this email address already exists.';
                break;
            case 'auth/weak-password':
                message = 'The password is too weak. It must be at least 6 characters long.';
                break;
            case 'auth/invalid-email':
                message = 'Please enter a valid email address.';
                break;
            case 'auth/invalid-api-key':
                message = 'Invalid API Key. Please check your Firebase configuration in the .env file.';
                break;
            case 'auth/too-many-requests':
                message = 'Too many attempts. Please try again later or reset your password.';
                break;
            case 'auth/user-disabled':
                message = 'This account has been disabled. Please contact support.';
                break;
            case 'auth/operation-not-allowed':
                message = 'This operation is not allowed. Please contact support.';
                break;
            default:
                message = 'An unexpected error occurred. Please try again.';
                console.error('Firebase Auth Error:', err);
                break;
        }
    } else if (err.message) {
        // Handle custom error messages (like email verification)
        message = err.message;
    }
    setError(message);
  }

  const performAuthAction = async (action: () => Promise<any>, setsLoading = true) => {
    if (!auth || !Object.keys(auth).length) {
      setError("Firebase is not configured. Cannot perform authentication.");
      return;
    }
    setError(null);
    if(setsLoading) setIsAuthLoading(true);
    try {
      await action();
    } catch (err) {
      handleAuthError(err);
    } finally {
      if(setsLoading) setIsAuthLoading(false);
    }
  };


  const signUp = async (email: string, password: string, displayName: string) => {
    await performAuthAction(async () => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        
        // Email verification disabled for now
        // await sendEmailVerification(userCredential.user);
        
        // The onSnapshot listener will create the user doc, so we don't need to do it here.
        toast({
            title: 'Account Created!',
            description: 'Welcome to TimeBubble! Your account has been created successfully.',
        });
    });
  };

  const signIn = async (email: string, password: string) => {
    await performAuthAction(async () => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Email verification disabled for now
      // if (!userCredential.user.emailVerified) {
      //   await firebaseSignOut(auth);
      //   throw new Error('Please verify your email address before signing in. Check your inbox for the verification email.');
      // }
    });
  };

  const signInWithGoogle = async () => {
    if (!auth || !Object.keys(auth).length) {
      setError("Firebase is not configured. Cannot perform authentication.");
      return;
    }
    setError(null);
    const provider = new GoogleAuthProvider(); // Ensure provider is created here
    await performAuthAction(async () => {
      await signInWithPopup(auth, provider); // Use signInWithPopup
    });
    // The redirect method doesn't return a promise that resolves with a result
    // We rely on the onAuthStateChanged listener after the redirect
  };

  const signOut = async () => {
    await performAuthAction(async () => {
      await firebaseSignOut(auth);
      router.push('/');
    });
  };
  
  const sendPasswordReset = async (email: string) => {
    await performAuthAction(async () => {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for instructions to reset your password.',
      });
    });
  };

  const sendEmailVerification = async () => {
    if (!user) return;
    await performAuthAction(async () => {
      await sendEmailVerification(user);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox for the verification email.',
      });
    }, false);
  };

  const setGeminiApiKey = async (key: string) => {
    if (!user) return;
    setGeminiApiKeyState(key);
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { geminiApiKey: key }, { merge: true });
    toast({
        title: 'API Key Saved',
        description: 'Your Gemini API key has been successfully saved.',
    });
  };

  const value = {
    user,
    loading: loading || isAuthLoading,
    error,
    isPro,
    isNewUser,
    geminiApiKey,
    setGeminiApiKey,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    sendEmailVerification,
    refreshUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
