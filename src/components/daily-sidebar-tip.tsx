
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, RefreshCw, Star, KeyRound } from 'lucide-react';
import { format, isToday } from 'date-fns';
import type { DailySidebarTip as DailySidebarTipType } from '@/types';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { ProModal } from './pro-modal';
import { ApiKeyModal } from './api-key-modal';

export function DailySidebarTip() {
  const [tip, setTip] = useState<DailySidebarTipType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { timeBlocks, currentDate, getNewDailySidebarTip } = useTimeBubbles();
  const { user, isPro, geminiApiKey } = useAuth();
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isCurrentDay = isToday(currentDate);

  const getStorageKey = useCallback(() => {
    if (!user) return null;
    return `daily_tip_${user.uid}_${format(currentDate, 'yyyy-MM-dd')}`;
  }, [user, currentDate]);


  const fetchTip = useCallback(async (forceRefresh = false) => {
    if (!isPro) {
      setIsLoading(false);
      return;
    }
     if (!geminiApiKey) {
      setIsLoading(false);
      setError("Please set your API key to get daily tips.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const storageKey = getStorageKey();

    try {
      if (storageKey && !forceRefresh) {
        const cachedTip = localStorage.getItem(storageKey);
        if (cachedTip) {
          try {
            const parsedTip = JSON.parse(cachedTip);
            setTip(parsedTip);
            setIsLoading(false);
            return;
          } catch(e) {
            console.warn("Could not parse cached tip, fetching new one.");
            localStorage.removeItem(storageKey);
          }
        }
      }

      const scheduleString = JSON.stringify(timeBlocks.map(b => ({ title: b.title, category: b.category, duration: b.duration })));
      const result = await getNewDailySidebarTip({ scheduleData: scheduleString });
      setTip(result);

      if (storageKey && result) {
        localStorage.setItem(storageKey, JSON.stringify(result));
      }
    } catch (err: any) {
      console.error('Failed to fetch daily tip:', err);
      if (err.message.includes("Invalid API Key")) {
        setError("Invalid API Key. Click to update it in your profile.");
        setIsApiKeyModalOpen(true);
      } else {
        setError('Could not load a tip. Click to retry.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeBlocks, currentDate, getNewDailySidebarTip, getStorageKey, isPro, geminiApiKey]);

  // Fetch tip on initial load and when date changes
  useEffect(() => {
    fetchTip();
  }, [currentDate, isPro, geminiApiKey]);
  
  // Refetch when schedule changes, with a debounce to prevent excessive calls during drag/edits
  useEffect(() => {
    if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
    }
    
    if (isLoading) return;
    
    debounceTimeoutRef.current = setTimeout(() => {
        if (isPro && geminiApiKey) {
            fetchTip(true);
        }
    }, 2000); // 2-second debounce delay

    return () => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    };
  }, [timeBlocks, isPro, geminiApiKey, isLoading, fetchTip]);


  // Refetch every hour to keep the tip fresh
  useEffect(() => {
    const hourlyInterval = setInterval(() => {
      if(isPro && geminiApiKey) {
        fetchTip(true);
      }
    }, 1000 * 60 * 60); // 1 hour

    return () => clearInterval(hourlyInterval);
  },[isPro, geminiApiKey, fetchTip])
  
  const handleRefresh = async () => {
     if (!isPro) {
        setIsProModalOpen(true);
        return;
    }
    if (!geminiApiKey) {
        setIsApiKeyModalOpen(true);
        return;
    }
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchTip(true);
  };
  
  const handleClick = () => {
    if (!isPro) {
        setIsProModalOpen(true);
        return;
    }
    if (!geminiApiKey) {
        setIsApiKeyModalOpen(true);
        return;
    }
    handleRefresh();
  }


  return (
    <>
    <Card 
        className="bg-primary/5 border-primary/20 shadow-sm cursor-pointer hover:bg-primary/10 transition-colors group"
        onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          { isPro ? <Lightbulb className="h-5 w-5 mt-0.5 text-amber-500 shrink-0" /> : <Star className="h-5 w-5 mt-0.5 text-amber-500 shrink-0" /> }
          <div className="flex-1">
            <div className="flex justify-between items-center">
                 <p className="font-semibold text-sm text-primary/90 mb-1">{isPro ? "Tip of the Day" : "Pro Tip"}</p>
                 {isPro && geminiApiKey && isCurrentDay && <RefreshCw className={cn("h-4 w-4 text-primary/60 transition-transform group-hover:rotate-180", isRefreshing && "animate-spin")} />}
            </div>
            {isLoading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : isPro ? (
                isCurrentDay ? (
                    <p className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">
                        {tip?.tip}
                    </p>
                ) : (
                     <p className='text-sm font-semibold'>Daily tips are available for the current day.</p>
                )
            ) : (
                <p className='text-sm font-semibold'>Upgrade to Pro to unlock daily personalized tips.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} error={error ?? undefined}/>
    </>
  );
}
