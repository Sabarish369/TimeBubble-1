
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
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
  const { toast } = useToast();

  useEffect(() => {
    // Check if auth object is valid before trying to use it
    if (!auth || !Object.keys(auth).length) {
      setError("Firebase is not configured. Please add your NEXT_PUBLIC_FIREBASE_ keys to the .env file.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthError = (err: any) => {
    // Do not show an error if the user intentionally closes the sign-in popup.
    if (err.code === 'auth/popup-closed-by-user') {
        return;
    }
    
    let message = 'An unknown error occurred.';

    if (err.code) {
        switch (err.code) {
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
    setLoading(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };


  const signUp = async (email: string, password: string, displayName: string) => {
    await performAuthAction(async () => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
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
    await performAuthAction(async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        // This line is crucial - it sets the user in the app state
        setUser(result.user);
    });
  };

  const signOut = async () => {
    await performAuthAction(() => firebaseSignOut(auth));
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
    loading,
    error,
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
