import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UpgradePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <h1 className="mb-4 text-4xl font-bold">Every feature is free</h1>
      <p className="mb-8 max-w-xl text-lg text-muted-foreground">
        All TimeBubble features are available to everyone. There are no paid plans or upgrade fees.
      </p>
      <Button asChild size="lg">
        <Link href="/app">Go to TimeBubble</Link>
      </Button>
    </main>
  );
}
