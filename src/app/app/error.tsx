'use client';

import { useEffect } from 'react';

export default function AppSectionError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App Section Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div>
        <h2 className="text-xl font-semibold mb-2">We hit a snag</h2>
        <p className="text-muted-foreground mb-4">A rendering error occurred. You can retry below.</p>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
          onClick={() => reset()}
        >
          Retry
        </button>
      </div>
    </div>
  );
}


