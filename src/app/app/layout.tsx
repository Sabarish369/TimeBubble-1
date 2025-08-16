
'use client';

import { AuthGuard } from "@/components/auth-guard";
import { TimeBubblesProvider } from "@/context/time-bubbles-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TimeBubblesProvider>
        {children}
      </TimeBubblesProvider>
    </AuthGuard>
  );
}
