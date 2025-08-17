
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
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
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isPro: boolean; 
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const setLoginCookie = (loggedIn: boolean) => {
    if (typeof window !== 'undefined') {
      document.cookie = `firebase-auth-logged-in=${loggedIn}; path=/; max-age=${loggedIn ? 30 * 24 * 60 * 60 : 0}`;
    }
  };

  useEffect(() => {
    if (!auth || !Object.keys(auth).length) {
      setError("Firebase is not configured. Please add your NEXT_PUBLIC_FIREBASE_ keys to the .env file.");
      setLoading(false);
      return;
    }

    const checkProStatus = async (user: User) => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().isPro) {
        setIsPro(true);
      } else {
        setIsPro(false);
        // If the doc doesn't exist, create it for the user
        if (!userDoc.exists()) {
          setDoc(userDocRef, { email: user.email, isPro: false }, { merge: true });
        }
      }
    };
    
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoginCookie(!!user);
      if (user) {
        checkProStatus(user);
      } else {
        setIsPro(false);
      }
      setLoading(false);
    });
    
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast({
            title: 'Signed In',
            description: `Welcome back, ${result.user.displayName}!`,
          });
        }
      })
      .catch((err) => {
        handleAuthError(err);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => unsubscribe();
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

  const performAuthAction = async (action: () => Promise<any>) => {
    if (!auth || !Object.keys(auth).length) {
      setError("Firebase is not configured. Cannot perform authentication.");
      return;
    }
    setIsAuthLoading(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsAuthLoading(false);
    }
  };


  const signUp = async (email: string, password: string, displayName: string) => {
    await performAuthAction(async () => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, { email, displayName, isPro: false });
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
    setIsAuthLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      handleAuthError(err);
      setIsAuthLoading(false);
    }
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


  const value = {
    user,
    loading: loading || isAuthLoading,
    error,
    isPro,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
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
