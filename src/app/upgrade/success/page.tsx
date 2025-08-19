
'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';
import { CelebrationPopper } from '@/components/celebration-popper';

export default function UpgradeSuccessPage() {
  const { user, refreshUserStatus } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [isUpdating, setIsUpdating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && sessionId) {
      const updateUserToPro = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { isPro: true }, { merge: true });
          // Manually trigger a refresh of user status
          await refreshUserStatus();
          
          // Wait for a moment to show the success message, then redirect
          setTimeout(() => {
            router.push('/app');
          }, 3000);

        } catch (err) {
          console.error("Failed to update user to Pro:", err);
          setError("There was an issue upgrading your account. Please contact support.");
        } finally {
          setIsUpdating(false);
        }
      };
      updateUserToPro();
    }
  }, [user, sessionId, router, refreshUserStatus]);

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

  if (isUpdating) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><LoadingSpinner /></div>
  }

  if (error) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <h1 className="text-2xl font-bold text-destructive mb-4">Upgrade Failed</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Button asChild>
                <Link href="/app">Go to My Timeline</Link>
            </Button>
        </div>
    )
  }

  return (
    <>
    <CelebrationPopper />
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <CheckCircle2 className="h-24 w-24 text-green-500 mb-6" />
      <h1 className="text-4xl md:text-5xl font-bold mb-4">Upgrade Successful!</h1>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
        Welcome to TimeBubble Pro! Please wait while we redirect you to the app...
      </p>
      <LoadingSpinner className="h-20 w-20" />
    </div>
    </>
  );
}
