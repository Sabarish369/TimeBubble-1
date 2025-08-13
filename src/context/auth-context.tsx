
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
    let message = 'An unknown error occurred.';
    if (err.code) {
        switch (err.code) {
            case 'auth/user-not-found':
                message = 'No account found with that email.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password. Please try again.';
                break;
            case 'auth/email-already-in-use':
                message = 'This email is already registered.';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak. It must be at least 6 characters.';
                break;
            case 'auth/invalid-email':
                message = 'Please enter a valid email address.';
                break;
            case 'auth/invalid-api-key':
                message = 'Invalid API Key. Please check your Firebase configuration in the .env file.';
                break;
            default:
                message = err.message;
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
    await performAuthAction(() => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    });
  };

  const signOut = async () => {
    await performAuthAction(() => firebaseSignOut(auth));
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
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
