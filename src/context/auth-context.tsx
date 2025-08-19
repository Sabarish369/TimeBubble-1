
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
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
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


  useEffect(() => {
    if (!auth || !Object.keys(auth).length) {
      setError("Firebase is not configured. Please add your NEXT_PUBLIC_FIREBASE_ keys to the .env file.");
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const handleUserChange = (user: User | null) => {
      setUser(user);
      setLoginCookie(!!user);
      if (user) {
        // Set up a real-time listener for the user document
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsPro(!!data.isPro);
            setGeminiApiKeyState(data.geminiApiKey || null);
          } else {
            // New user, create their doc
            setDoc(userDocRef, { email: user.email, displayName: user.displayName, isPro: false }, { merge: true });
            setIsPro(false);
            setGeminiApiKeyState(null);
          }
        });
        return unsubscribe;
      } else {
        // User logged out, clear state
        setIsPro(false);
        setGeminiApiKeyState(null);
        return () => {};
      }
    };
    
    // Check for redirect result first
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast({ title: 'Signed in successfully!' });
        }
        // Then set up the auth state listener
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          const unsubscribeUserDoc = handleUserChange(user);
          // Set loading to false only after the initial user check is complete
          setLoading(false);
          return () => {
            unsubscribeAuth();
            unsubscribeUserDoc();
          };
        });
      })
      .catch((err) => {
        handleAuthError(err);
        setLoading(false);
      });

  }, [toast]);

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
            default:
                message = 'An unexpected error occurred. Please try again.';
                console.error('Firebase Auth Error:', err);
                break;
        }
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
        // The onSnapshot listener will create the user doc, so we don't need to do it here.
        toast({
            title: 'Account Created!',
            description: 'Welcome to TimeBubble!',
        });
    });
  };

  const signIn = async (email: string, password: string) => {
    await performAuthAction(() => signInWithEmailAndPassword(auth, email, password));
  };

  const signInWithGoogle = async () => {
    if (!auth || !Object.keys(auth).length) {
      setError("Firebase is not configured. Cannot perform authentication.");
      return;
    }
    setError(null);
    const provider = new GoogleAuthProvider();
    // Use performAuthAction without setting loading state, as redirect handles it
    await performAuthAction(() => signInWithRedirect(auth, provider), false);
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
    geminiApiKey,
    setGeminiApiKey,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
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
