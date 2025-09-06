'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { TimeBubbleLogo } from '@/components/timebubble-logo';

type PaymentStatus = 'processing' | 'success' | 'error' | 'cancelled';

export default function PayPalReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>('processing');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const processPayment = async () => {
      try {
        const token = searchParams.get('token'); // PayPal order ID
        const payerId = searchParams.get('PayerID');
        
        if (!token) {
          setStatus('error');
          setMessage('Payment information missing. Please try again.');
          return;
        }

        if (!payerId) {
          setStatus('cancelled');
          setMessage('Payment was cancelled. You can try again anytime.');
          return;
        }

        if (!user) {
          setStatus('error');
          setMessage('Authentication required. Please sign in and try again.');
          return;
        }

        // Get Firebase ID token
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          setStatus('error');
          setMessage('Authentication failed. Please sign in and try again.');
          return;
        }

        // Capture the PayPal payment
        const captureResponse = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, orderId: token }),
        });

        const respType = captureResponse.headers.get('content-type') || '';
        let result: any = {};
        if (respType.includes('application/json')) {
          result = await captureResponse.json();
        } else {
          const text = await captureResponse.text().catch(() => '');
          throw new Error(`Unexpected non-JSON response from server. ${text?.slice(0,200)}`);
        }

        if (captureResponse.ok && result.success) {
          setStatus('success');
          setMessage(result.message || 'Payment successful! Pro access activated.');
          
          // Redirect to success page after a short delay
          setTimeout(() => {
            router.push('/upgrade/success');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Payment processing failed. Please contact support.');
        }

      } catch (error: any) {
        console.error('Payment processing error:', error);
        setStatus('error');
        setMessage(error?.message || 'An unexpected error occurred. Please contact support.');
      }
    };

    processPayment();
  }, [searchParams, user, router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-primary';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'cancelled':
        return 'text-yellow-500';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/app" className="flex items-center gap-2">
            <TimeBubbleLogo className="h-6 w-auto" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="text-center space-y-6">
            {/* Status Icon */}
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>

            {/* Status Message */}
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${getStatusColor()}`}>
                {status === 'processing' && 'Processing Payment'}
                {status === 'success' && 'Payment Successful!'}
                {status === 'error' && 'Payment Failed'}
                {status === 'cancelled' && 'Payment Cancelled'}
              </h1>
              <p className="text-muted-foreground">{message}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {status === 'success' && (
                <Button asChild className="w-full">
                  <Link href="/upgrade/success">Continue</Link>
                </Button>
              )}
              
              {(status === 'error' || status === 'cancelled') && (
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/upgrade">Try Again</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/app">Back to App</Link>
                  </Button>
                </div>
              )}

              {status === 'processing' && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/app">Back to App</Link>
                </Button>
              )}
            </div>

            {/* Support Link */}
            {status === 'error' && (
              <p className="text-sm text-muted-foreground">
                Need help? Contact{' '}
                <a href="mailto:support@timebubble.app" className="text-primary hover:underline">
                  support@timebubble.app
                </a>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
