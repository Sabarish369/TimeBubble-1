
'use client';

import { useAuth } from '@/context/auth-context';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginModal } from '@/components/login-modal';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-40 w-40 text-primary" />
      </div>
    );
  }
  
  if (!user) {
    // Although the modal is controlled on page.tsx,
    // this ensures nothing is rendered behind it if the user is not authenticated.
    // It also provides a fallback.
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoginModal isOpen={true} onClose={() => {}} />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-40" />
      </div>
    );
  }

  return <>{children}</>;
}
