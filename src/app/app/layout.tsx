
'use client';

import { AppAuthGuard } from "@/components/app-auth-guard";
import { TimeBubblesProvider } from "@/context/time-bubbles-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppAuthGuard>
      <TimeBubblesProvider>
        {children}
      </TimeBubblesProvider>
    </AppAuthGuard>
  );
}
