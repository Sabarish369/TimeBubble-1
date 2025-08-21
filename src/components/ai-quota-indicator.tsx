
'use client';

import { useState, useEffect } from 'react';
import { BrainCircuit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { useTimeBubbles } from '@/context/time-bubbles-context';

const SIMULATED_DAILY_QUOTA = 100; // An arbitrary number for demonstration

export function AiQuotaIndicator() {
  const { isPro } = useAuth();
  const { aiCallCount } = useTimeBubbles();
  
  // Calculate usage percentage based on an arbitrary daily limit for simulation
  const usagePercentage = (aiCallCount / SIMULATED_DAILY_QUOTA) * 100;

  if (!isPro) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <BrainCircuit className="h-5 w-5 text-primary/80" />
            <div className="w-24">
              <Progress value={usagePercentage} className="h-2" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs">
          <p className="font-bold mb-2">Illustrative AI Quota</p>
          <p className="text-xs text-muted-foreground mb-2">
            This bar shows an estimate of your Gemini API usage based on actions in this session ({aiCallCount} calls).
          </p>
          <p className="text-xs text-muted-foreground">
            Since you are using your own API key, please refer to your{' '}
            <Link href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Google AI Studio dashboard
            </Link> for precise quota limits and usage details.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
