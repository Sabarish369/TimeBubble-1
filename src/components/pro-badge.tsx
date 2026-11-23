
'use client';

import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

export function ProBadge() {
  // Pro is free for everyone - always show the badge
  return (
    <div
      className={cn(
        'px-2 py-0.5 text-xs font-bold rounded-full flex items-center gap-1',
        'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
      )}
    >
      <Crown className="h-3 w-3" />
      <span>PRO</span>
    </div>
  );
}
