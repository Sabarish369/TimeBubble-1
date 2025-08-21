
'use client';

import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

export function ProBadge() {
  const { isPro } = useAuth();

  if (!isPro) {
    return null;
  }

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
