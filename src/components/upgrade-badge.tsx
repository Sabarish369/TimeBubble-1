
'use client';

import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export function UpgradeBadge() {
  const { isPro } = useAuth();

  if (isPro) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Link href="/upgrade">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-amber-400/50 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 dark:from-amber-950/20 dark:to-yellow-950/20 dark:hover:from-amber-900/30 dark:hover:to-yellow-900/30 text-amber-700 dark:text-amber-300 shadow-sm"
            >
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium">Upgrade</span>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs">
          <p className="font-bold mb-2">Upgrade to Pro</p>
          <p className="text-xs text-muted-foreground">
            Unlock AI-powered features including smart suggestions, daily insights, and personalized tips.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
