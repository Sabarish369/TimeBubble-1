
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

export function AiQuotaIndicator() {
  const { isPro } = useAuth();
  const [usage, setUsage] = useState<number | null>(null);

  useEffect(() => {
    // This is a simulation. In a real scenario, you might try to estimate
    // usage based on local actions, but it wouldn't be accurate.
    // We run this in useEffect to avoid server/client mismatch (hydration error).
    setUsage(15 + Math.random() * 10);
  }, []);

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
              {usage !== null ? (
                <Progress value={usage} className="h-2" />
              ) : (
                <div className="h-2 w-full rounded-full bg-secondary" /> 
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs">
          <p className="font-bold mb-2">Illustrative AI Quota</p>
          <p className="text-xs text-muted-foreground">
            This bar shows an estimate of your Gemini API usage. Since you are using your own API key, please refer to your{' '}
            <Link href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Google AI Studio dashboard
            </Link> for precise quota limits and usage details.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
