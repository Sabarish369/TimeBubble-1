
'use client';

import { CheckCircle2 } from 'lucide-react';
import { LockBreakingBubble } from '@/components/lock-breaking-bubble';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState, Suspense } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';
import { CelebrationPopper } from '@/components/celebration-popper';
import { ProUpgradeAnimation } from '@/components/pro-upgrade-animation';

function UpgradeSuccessContent() {
  const { user, refreshUserStatus } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const paypalToken = searchParams.get('token'); // PayPal order ID
  const payerId = searchParams.get('PayerID');
  const [isUpdating, setIsUpdating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeAnimation, setShowUpgradeAnimation] = useState(false);
  const [showSuccessContent, setShowSuccessContent] = useState(false);

  useEffect(() => {
    if (user && (sessionId || (paypalToken && payerId))) {
      const updateUserToPro = async () => {
        try {
          // Handle PayPal payment completion
          if (paypalToken && payerId) {
            const idToken = await user.getIdToken();
            const captureRes = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: paypalToken, idToken }),
            });
            
            if (!captureRes.ok) {
              const err = await captureRes.json().catch(() => ({}));
              console.error('PayPal capture failed:', err);
              throw new Error(err.error || 'Failed to capture PayPal payment');
            }
          }

          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { isPro: true }, { merge: true });
          // Manually trigger a refresh of user status
          await refreshUserStatus();
          
          setIsUpdating(false);
          setShowUpgradeAnimation(true);

        } catch (err) {
          console.error("Failed to update user to Pro:", err);
          setError("There was an issue upgrading your account. Please contact support.");
          setIsUpdating(false);
        }
      };
      updateUserToPro();
    }
  }, [user, sessionId, paypalToken, payerId, router, refreshUserStatus]);

  const handleAnimationComplete = () => {
    setShowUpgradeAnimation(false);
    setShowSuccessContent(true);
    
    // Redirect after showing success content
    setTimeout(() => {
      router.push('/app');
    }, 3000);
  };

  if (!sessionId && !paypalToken) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Session</h1>
            <p className="text-muted-foreground mb-8">No payment session was found. Please return to the app.</p>
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
    {showUpgradeAnimation && (
      <ProUpgradeAnimation 
        isVisible={showUpgradeAnimation} 
        onComplete={handleAnimationComplete} 
      />
    )}
    
    {showSuccessContent && <CelebrationPopper />}
    
    {showSuccessContent && (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 text-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Lock-breaking bubble animation */}
        <div className="relative mb-8">
          <div className="flex justify-center">
            <LockBreakingBubble size="lg" />
          </div>
          
          {/* Floating sparkles around bubble */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  top: `${30 + Math.sin((i * Math.PI) / 4) * 60}px`,
                  left: `${30 + Math.cos((i * Math.PI) / 4) * 60}px`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Enhanced title with gradient */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent animate-pulse">
          Unlock Complete! 🔓
        </h1>

        {/* Subtitle with better typography */}
        <div className="mb-8 space-y-2">
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            🎉 Welcome to <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">TimeBubble Pro!</span>
          </p>
          <p className="text-lg text-muted-foreground/80">
            Please wait while we redirect you to the app...
          </p>
        </div>

        {/* Enhanced loading spinner */}
        <div className="relative">
          <LoadingSpinner className="h-24 w-24 mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-primary/20 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Pro features preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: '🚀', title: 'AI Insights', desc: 'Advanced analytics' },
            { icon: '⚡', title: 'Smart Tips', desc: 'Proactive suggestions' },
            { icon: '📊', title: 'Trend Analysis', desc: 'Long-term patterns' },
          ].map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    )}
    </>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><LoadingSpinner /></div>}>
      <UpgradeSuccessContent />
    </Suspense>
  );
}
