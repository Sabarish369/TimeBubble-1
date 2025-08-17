
'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function UpgradeSuccessPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (user && sessionId) {
      const updateUserToPro = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { isPro: true }, { merge: true });
          // Optionally, you can store the session ID for reconciliation
          // await setDoc(doc(db, 'stripe_sessions', sessionId), { userId: user.uid, status: 'completed' });
        } catch (error) {
          console.error("Failed to update user to Pro:", error);
          // Handle error - maybe show a message to the user to contact support
        }
      };
      updateUserToPro();
    }
  }, [user, sessionId]);

  if (!sessionId) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Session</h1>
            <p className="text-muted-foreground mb-8">No session ID was found. Please return to the app.</p>
            <Button asChild>
                <Link href="/app">Go to My Timeline</Link>
            </Button>
        </div>
    )
  }

  if (!user) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><LoadingSpinner /></div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <CheckCircle2 className="h-24 w-24 text-green-500 mb-6" />
      <h1 className="text-4xl md:text-5xl font-bold mb-4">Upgrade Successful!</h1>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
        Welcome to TimeBubble Pro! You've unlocked all premium features. Your account has been upgraded, and you're all set to supercharge your productivity.
      </p>
      <Button asChild size="lg">
        <Link href="/app">Start Using Pro Features</Link>
      </Button>
    </div>
  );
}
