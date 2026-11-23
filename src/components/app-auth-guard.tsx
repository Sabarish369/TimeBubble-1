'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { LoadingSpinner } from '@/components/loading-spinner';
import { usePathname, useRouter } from 'next/navigation';

export function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname?.startsWith('/app')) {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-40 w-40 text-primary" />
      </div>
    );
  }
  
  // If on an app route and no user, show loading spinner while redirecting
  if (pathname?.startsWith('/app') && !user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-40 w-40 text-primary" />
      </div>
    );
  }

  // Email verification UI disabled for now
  // if (needsEmailVerification) {
  //   return (
  //     <>
  //       <div className="min-h-screen flex items-center justify-center p-4">
  //         <div className="max-w-md w-full space-y-6">
  //           <div className="text-center">
  //             <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
  //             <h1 className="text-2xl font-bold mb-2">Email Verification Required</h1>
  //             <p className="text-muted-foreground mb-6">
  //               Please verify your email address to access TimeBubble.
  //             </p>
  //           </div>

  //           <Alert>
  //             <AlertCircle className="h-4 w-4" />
  //             <AlertDescription>
  //             We've sent a verification email to <strong>{user.email}</strong>. 
  //             Please check your inbox and click the verification link.
  //             </AlertDescription>
  //           </Alert>

  //           <div className="space-y-3">
  //             <Button 
  //               onClick={() => setShowVerificationModal(true)}
  //               className="w-full"
  //             >
  //               Resend Verification Email
  //             </Button>
  //             
  //             <Button 
  //               variant="outline" 
  //               onClick={() => window.location.reload()}
  //               className="w-full"
  //             >
  //               I've Verified My Email
  //             </Button>
  //           </div>

  //           <div className="text-center text-sm text-muted-foreground">
  //             <p>Having trouble? Check your spam folder or contact support.</p>
  //           </div>
  //         </div>
  //       </div>

  //       <EmailVerificationModal
  //         isOpen={showVerificationModal}
  //         onClose={() => setShowVerificationModal(false)}
  //         email={user.email || ''}
  //       />
  //     </>
  //   );
  // }

  // Show children if user is verified
  return <>{children}</>;
}
