'use client';

import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TimeBubbleLogo } from '@/components/timebubble-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { SmartSuggestions } from '@/components/smart-suggestions';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b shrink-0">
      <div className="flex items-center gap-4">
        <TimeBubbleLogo className="h-6 w-auto" />
      </div>
      <div className="flex-1 flex justify-center">
        <span className="text-lg font-semibold text-foreground/80">
          {format(new Date(), 'EEEE, MMMM do')}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <SmartSuggestions />
        <ThemeToggle />
      </div>
    </header>
  );
}
