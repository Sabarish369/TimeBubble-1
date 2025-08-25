
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { EmailVerificationModal } from './email-verification-modal';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Mail } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Check if user is logged in but email is not verified
  const needsEmailVerification = user && !user.emailVerified;

  useEffect(() => {
    if (needsEmailVerification) {
      setShowVerificationModal(true);
    }
  }, [needsEmailVerification]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show email verification UI if user is not verified
  if (needsEmailVerification) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Email Verification Required</h1>
              <p className="text-muted-foreground mb-6">
                Please verify your email address to access TimeBubble.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We've sent a verification email to <strong>{user.email}</strong>. 
                Please check your inbox and click the verification link.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                onClick={() => setShowVerificationModal(true)}
                className="w-full"
              >
                Resend Verification Email
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                I've Verified My Email
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Having trouble? Check your spam folder or contact support.</p>
            </div>
          </div>
        </div>

        <EmailVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          email={user.email || ''}
        />
      </>
    );
  }

  // Show children if user is verified or not logged in
  return <>{children}</>;
}
