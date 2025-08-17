
'use client';

import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UpgradeCanceledPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <XCircle className="h-24 w-24 text-destructive mb-6" />
      <h1 className="text-4xl md:text-5xl font-bold mb-4">Upgrade Canceled</h1>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
        Your upgrade process was canceled. You can return to the upgrade page anytime to complete your purchase and unlock Pro features.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg" variant="outline">
            <Link href="/upgrade">View Plans</Link>
        </Button>
        <Button asChild size="lg">
            <Link href="/app">Back to App</Link>
        </Button>
      </div>
    </div>
  );
}
