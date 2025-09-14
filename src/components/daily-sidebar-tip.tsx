
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
  }, [user?.uid, currentDate, isClient]);

  const getScheduleHash = useCallback(() => {
    // Create a hash of the current schedule to detect changes
    const scheduleString = JSON.stringify(timeBlocks.map(b => ({ 
      title: b.title, 
      category: b.category, 
      duration: b.duration,
      startTime: format(new Date(b.startTime), 'HH:mm')
    })));
    
    // Use TextEncoder to handle Unicode characters properly
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(scheduleString);
      
      // Create a simple hash from the byte array
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
      }
      
      // Convert to base36 for a shorter string
      return Math.abs(hash).toString(36).slice(0, 16);
    } catch (error) {
      // Fallback to a simple string hash if TextEncoder fails
      let hash = 0;
      for (let i = 0; i < scheduleString.length; i++) {
        const char = scheduleString.charCodeAt(i);
        hash = ((hash << 5) - hash + char) & 0xffffffff;
      }
      return Math.abs(hash).toString(36).slice(0, 16);
    }
  }, [timeBlocks]);

  const shouldRegenerateTip = useCallback(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return true;
    
    try {
      const cached = localStorage.getItem(storageKey);
      if (!cached) return true;
      
      const { scheduleHash } = JSON.parse(cached);
      const currentHash = getScheduleHash();
      
      // Only regenerate if schedule changed significantly
      return scheduleHash !== currentHash;
    } catch {
      return true;
    }
  }, [getStorageKey, getScheduleHash]);

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
            
            // Check if schedule changed or cache is too old (24 hours)
            const isExpired = Date.now() - (parsedTip.timestamp || 0) > 24 * 60 * 60 * 1000;
            const scheduleChanged = parsedTip.scheduleHash !== getScheduleHash();
            
            if (!isExpired && !scheduleChanged) {
              console.log('Using cached tip - schedule unchanged:', parsedTip);
              setTip({ tip: parsedTip.tip });
              setIsLoading(false);
              return;
            } else {
              console.log('Cache invalid:', { isExpired, scheduleChanged });
              localStorage.removeItem(storageKey);
            }
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
        const cacheData = {
          ...result,
          scheduleHash: getScheduleHash(),
          timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(cacheData));
        console.log('Cached tip with schedule hash for smart reuse');
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
  }, [getStorageKey, timeBlocks, getNewDailySidebarTip, isPro, geminiApiKey, getScheduleHash]);

  // Fetch tip on initial load and when date changes, but only on the client
  useEffect(() => {
    console.log('Daily tips useEffect triggered:', { isClient, isPro, geminiApiKey: !!geminiApiKey, hasFetched: hasFetchedRef.current, currentDate });
    // Allow tips for any date, not just today
    if (isClient && isPro && geminiApiKey && !hasFetchedRef.current) {
      console.log('Triggering fetchTip...');
      hasFetchedRef.current = true;
      fetchTip();
    }
  }, [currentDate, isClient, isPro, geminiApiKey]);

  // Debounced schedule change detection - only refetch after inactivity period
  useEffect(() => {
    if (isClient && isPro && geminiApiKey && hasFetchedRef.current && tip) {
      if (shouldRegenerateTip()) {
        console.log('Schedule changed significantly, will regenerate tip after inactivity period');
        
        // Clear any existing timeout
        const timeoutId = setTimeout(() => {
          console.log('Inactivity period reached, regenerating tip');
          fetchTip(true);
        }, 300000); // Wait 5 minutes of inactivity before regenerating
        
        // Store timeout ID for cleanup
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
  }, [timeBlocks, isClient, isPro, geminiApiKey, tip, shouldRegenerateTip, fetchTip]);

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
    } else if (isPro) {
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
        className={cn((!isPro || (isPro && geminiApiKey)) && "cursor-pointer")}
        onClick={handleCardClick}
      >
        <Card 
            className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30"
        >
          <CardContent className="p-4">
            {/* Enhanced accent glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-400/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-500/20 flex items-center justify-center ring-1 ring-amber-400/40 shadow-sm">
                { isPro ? <Lightbulb className="h-4 w-4 text-amber-600 drop-shadow-sm" /> : <Star className="h-4 w-4 text-amber-600 drop-shadow-sm" /> }
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <p className="font-bold text-sm text-primary">{isPro ? "Today's Focus" : "Pro Tip"}</p>
                       {isPro && tip?.tip && (
                         <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Fresh tip loaded" />
                       )}
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
                    tip?.tip ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move leading-relaxed">
                          {tip.tip}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-primary/80">
                          Get your personalized tip for {format(currentDate, 'MMM d')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click to generate actionable insights from your schedule
                        </p>
                      </div>
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
