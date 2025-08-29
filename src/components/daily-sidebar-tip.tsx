
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Star } from 'lucide-react';
import { format, isToday } from 'date-fns';
import type { DailySidebarTip as DailySidebarTipType } from '@/types';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { useAuth } from '@/context/auth-context';
import { ProModal } from './pro-modal';
import { ApiKeyModal } from './api-key-modal';
import { cn } from '@/lib/utils';

export function DailySidebarTip() {
  const [tip, setTip] = useState<DailySidebarTipType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const hasFetchedRef = useRef(false); // Track if we've already fetched for this date
  const isLoadingRef = useRef(false); // Track loading state to prevent race conditions
  
  const { timeBlocks, currentDate, getNewDailySidebarTip } = useTimeBubbles();
  const { user, isPro, geminiApiKey } = useAuth();
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    // This ensures client-specific code runs only after mounting
    setIsClient(true);
  }, []);

  const getStorageKey = useCallback(() => {
    if (!user || !isClient) return null;
    return `daily_tip_${user.uid}_${format(currentDate, 'yyyy-MM-dd')}`;
  }, [user?.uid, currentDate, isClient]); // Use user.uid instead of user object

  const fetchTip = useCallback(async (forceRefresh = false) => {
    console.log('fetchTip called:', { isPro, geminiApiKey: !!geminiApiKey, forceRefresh, isLoading });
    
    if (!isPro) {
      setIsLoading(false);
      setError(null);
      return;
    }
     if (!geminiApiKey) {
      setIsLoading(false);
      setError("Please set your API key to get daily tips.");
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingRef.current && !forceRefresh) {
      console.log('Already loading, skipping...');
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    const storageKey = getStorageKey();
    console.log('Storage key:', storageKey);

    try {
      if (storageKey && !forceRefresh) {
        const cachedTip = localStorage.getItem(storageKey);
        if (cachedTip) {
          try {
            const parsedTip = JSON.parse(cachedTip);
            console.log('Using cached tip:', parsedTip);
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
      console.log('Calling API with schedule:', scheduleString);
      const result = await getNewDailySidebarTip({ scheduleData: scheduleString });
      console.log('API result:', result);
      setTip(result);

      if (storageKey && result) {
        localStorage.setItem(storageKey, JSON.stringify(result));
        console.log('Cached tip for future use');
      }
    } catch (err: any) {
      console.error('Failed to fetch daily tip:', err);
      if (err.message && (err.message.includes("Invalid API Key") || err.message.includes("API key not valid"))) {
        setError("Invalid API Key. Click to update it in your profile.");
        setIsApiKeyModalOpen(true);
      } else if (err.message && err.message.includes("429")) {
        setError("Rate limit exceeded. Please try again later.");
      } else {
        setError('Could not load a tip. Click to retry.');
      }
    } finally {
      console.log('fetchTip completed, setting loading to false');
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [getStorageKey, timeBlocks, getNewDailySidebarTip, isPro, geminiApiKey]); // Removed isLoading to prevent circular dependency

  // Fetch tip on initial load and when date changes, but only on the client
  useEffect(() => {
    console.log('Daily tips useEffect triggered:', { isClient, isPro, geminiApiKey: !!geminiApiKey, hasFetched: hasFetchedRef.current, currentDate });
    if (isClient && isPro && geminiApiKey && !hasFetchedRef.current && isToday(currentDate)) {
      console.log('Triggering fetchTip...');
      hasFetchedRef.current = true;
      fetchTip();
    }
  }, [currentDate, isClient, isPro, geminiApiKey]); // Remove fetchTip from dependencies to prevent infinite loop

  // Reset fetch flag when date changes
  useEffect(() => {
    console.log('Date changed, resetting fetch flag:', currentDate);
    hasFetchedRef.current = false;
    setTip(null);
    setError(null);
  }, [currentDate]);

  const handleCardClick = () => {
    if (!isPro) {
      setIsProModalOpen(true);
    } else if (isPro && isToday(currentDate)) {
      if (error) {
        // If there's an error, retry the fetch
        hasFetchedRef.current = false;
        fetchTip(true);
      } else {
        // Otherwise, force refresh
        fetchTip(true);
      }
    }
  };

  if (!isClient) {
    // Render a skeleton or placeholder on the server to avoid client/server mismatch
    return (
      <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center ring-1 ring-amber-400/30">
              <Lightbulb className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div
        className={cn((!isPro || isToday(currentDate)) && "cursor-pointer")}
        onClick={handleCardClick}
      >
        <Card 
            className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm"
        >
          <CardContent className="p-4">
            {/* Accent glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center ring-1 ring-amber-400/30">
                { isPro ? <Lightbulb className="h-4 w-4 text-amber-500" /> : <Star className="h-4 w-4 text-amber-500" /> }
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <p className="font-semibold text-sm text-primary/90">{isPro ? "Tip of the Day" : "Pro Tip"}</p>
                     </div>
                </div>
                {isLoading ? (
                  <div className="space-y-1.5 pt-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : error ? (
                  <p className="text-xs text-destructive">{error}</p>
                ) : isPro ? (
                    isToday(currentDate) ? (
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
      </div>
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} error={error ?? undefined}/>
    </>
  );
}
