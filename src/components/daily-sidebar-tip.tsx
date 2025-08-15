
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, RefreshCw, Star } from 'lucide-react';
import { format } from 'date-fns';
import type { DailySidebarTip as DailySidebarTipType } from '@/types';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { ProModal } from './pro-modal';

export function DailySidebarTip() {
  const [tip, setTip] = useState<DailySidebarTipType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getBlocksForDate, currentDate, getNewDailySidebarTip } = useTimeBubbles();
  const { user, isPro } = useAuth();
  const [isProModalOpen, setIsProModalOpen] = useState(false);


  const getStorageKey = useCallback(() => {
    if (!user) return null;
    return `daily_tip_${user.uid}_${format(currentDate, 'yyyy-MM-dd')}`;
  }, [user, currentDate]);


  const fetchTip = useCallback(async () => {
    if (!isPro) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const storageKey = getStorageKey();

    try {
      if (storageKey) {
        const cachedTip = localStorage.getItem(storageKey);
        if (cachedTip) {
          setTip(JSON.parse(cachedTip));
          setIsLoading(false);
          return;
        }
      }

      const scheduleForDay = await getBlocksForDate(currentDate);
      const scheduleString = JSON.stringify(scheduleForDay.map(b => ({ title: b.title, category: b.category, duration: b.duration })));
      const result = await getNewDailySidebarTip({ scheduleData: scheduleString });
      setTip(result);

      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(result));
      }
    } catch (err) {
      console.error('Failed to fetch daily tip:', err);
      setError('Could not load a tip for today.');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, getBlocksForDate, getNewDailySidebarTip, getStorageKey, isPro]);

  useEffect(() => {
    fetchTip();
  }, [fetchTip]);
  
  const handleRefresh = async () => {
    if (!isPro) {
        setIsProModalOpen(true);
        return;
    }
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    try {
        const scheduleForDay = await getBlocksForDate(currentDate);
        const scheduleString = JSON.stringify(scheduleForDay.map(b => ({ title: b.title, category: b.category, duration: b.duration })));
        const newTip = await getNewDailySidebarTip({ scheduleData: scheduleString });
        setTip(newTip);
        const storageKey = getStorageKey();
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(newTip));
        }
    } catch (err) {
        console.error('Failed to refresh tip:', err);
        setError('Could not get a new tip.');
    } finally {
        setIsRefreshing(false);
    }
  };


  return (
    <>
    <Card 
        className="bg-primary/5 border-primary/20 shadow-sm cursor-pointer hover:bg-primary/10 transition-colors group"
        onClick={handleRefresh}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          { isPro ? <Lightbulb className="h-5 w-5 mt-0.5 text-amber-500 shrink-0" /> : <Star className="h-5 w-5 mt-0.5 text-amber-500 shrink-0" /> }
          <div className="flex-1">
            <div className="flex justify-between items-center">
                 <p className="font-semibold text-sm text-primary/90 mb-1">{isPro ? "Tip of the Day" : "Pro Tip"}</p>
                 {isPro && <RefreshCw className={cn("h-4 w-4 text-primary/60 transition-transform group-hover:rotate-180", isRefreshing && "animate-spin")} />}
            </div>
            {isLoading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : isPro ? (
              <p className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">
                {tip?.tip}
              </p>
            ) : (
                <p className='text-sm font-semibold'>Upgrade to Pro to unlock daily personalized tips.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    </>
  );
}
