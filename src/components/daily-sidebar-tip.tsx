'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';
import { getDailySidebarTip } from '@/ai/flows/daily-sidebar-tip';
import { format } from 'date-fns';
import type { DailySidebarTip as DailySidebarTipType } from '@/types';

export function DailySidebarTip() {
  const [tip, setTip] = useState<DailySidebarTipType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTip = async () => {
      setIsLoading(true);
      setError(null);
      const today = format(new Date(), 'yyyy-MM-dd');
      const storageKey = `daily_tip_${today}`;

      try {
        const cachedTip = localStorage.getItem(storageKey);
        if (cachedTip) {
          setTip(JSON.parse(cachedTip));
        } else {
          const result = await getDailySidebarTip({ date: today });
          setTip(result);
          localStorage.setItem(storageKey, JSON.stringify(result));
        }
      } catch (err) {
        console.error('Failed to fetch daily tip:', err);
        setError('Could not load a tip for today.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTip();
  }, []);

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 mt-0.5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-primary/90 mb-1">Tip of the Day</p>
            {isLoading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{tip?.tip}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
