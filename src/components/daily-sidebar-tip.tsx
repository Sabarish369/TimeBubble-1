
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Star } from 'lucide-react';
import { format, isToday } from 'date-fns';
import type { DailySidebarTip as DailySidebarTipType } from '@/types';
import { useTimeBubbles } from '@/context/time-bubbles-context';
// import { cn } from '@/lib/utils';
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
  const scheduleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCurrentDay = isToday(currentDate);

  const getStorageKey = useCallback(() => {
    if (!user) return null;
    return `daily_tip_${user.uid}_${format(currentDate, 'yyyy-MM-dd')}`;
  }, [user, currentDate]);

  // Refresh meta persistence (per user/day)
  const getMetaKey = useCallback(() => {
    if (!user) return null;
    return `daily_tip_meta_${user.uid}_${format(currentDate, 'yyyy-MM-dd')}`;
  }, [user, currentDate]);

  type TipMeta = {
    count: number;
    nextIndex: number; // index into schedule
    schedule: string[]; // ISO times for today
    lastRefresh?: string; // ISO
  };

  const loadMeta = useCallback((): TipMeta => {
    const key = getMetaKey();
    const base: TipMeta = { count: 0, nextIndex: 0, schedule: [] };
    if (!key) return base;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.schedule)) return base;
      return { ...base, ...parsed } as TipMeta;
    } catch {
      return base;
    }
  }, [getMetaKey]);

  const saveMeta = useCallback((meta: TipMeta) => {
    const key = getMetaKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(meta));
  }, [getMetaKey]);

  const isWithinActiveHours = (date: Date) => {
    const hour = date.getHours();
    return hour >= 7 && hour < 19; // 7am inclusive to 7pm exclusive
  };

  const generateSchedule = useCallback((): string[] => {
    // 5 evenly spaced times between 07:00 and 19:00 (12 hours / 5 = 144 minutes apart)
    const base = new Date(currentDate);
    base.setHours(7, 0, 0, 0);
    const points: string[] = [];
    for (let i = 0; i < 5; i++) {
      const t = new Date(base.getTime() + i * 144 * 60 * 1000);
      points.push(t.toISOString());
    }
    return points;
  }, [currentDate]);

  const [meta, setMeta] = useState<TipMeta>(() => loadMeta());

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
        setError('Could not load a tip.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeBlocks, currentDate, getNewDailySidebarTip, getStorageKey, isPro, geminiApiKey]);

  // Initialize schedule/meta for the day and start scheduler
  useEffect(() => {
    if (!isCurrentDay || !isPro || !geminiApiKey) return;

    let currentMeta = loadMeta();
    if (!currentMeta.schedule || currentMeta.schedule.length !== 5) {
      currentMeta = { count: 0, nextIndex: 0, schedule: generateSchedule() };
      saveMeta(currentMeta);
      setMeta(currentMeta);
    } else {
      setMeta(currentMeta);
    }

    if (scheduleIntervalRef.current) clearInterval(scheduleIntervalRef.current);
    scheduleIntervalRef.current = setInterval(() => {
      const now = new Date();
      const freshMeta = loadMeta();
      if (freshMeta.count >= 5) return; // limit reached
      if (!isWithinActiveHours(now)) return; // outside hours
      const nextIso = freshMeta.schedule[freshMeta.nextIndex];
      if (!nextIso) return;
      const nextDate = new Date(nextIso);
      if (now >= nextDate) {
        // fire a refresh
        setIsRefreshing(true);
        fetchTip(true).finally(() => {
          const updated: TipMeta = {
            ...freshMeta,
            count: (freshMeta.count || 0) + 1,
            nextIndex: freshMeta.nextIndex + 1,
            lastRefresh: new Date().toISOString(),
          };
          saveMeta(updated);
          setMeta(updated);
        });
      }
    }, 30 * 1000); // check every 30s

    return () => {
      if (scheduleIntervalRef.current) clearInterval(scheduleIntervalRef.current);
    };
  }, [isCurrentDay, isPro, geminiApiKey, generateSchedule, loadMeta, saveMeta, fetchTip]);

  // Fetch tip on initial load and when date changes (no auto-forced changes)
  useEffect(() => {
    fetchTip();
  }, [currentDate, isPro, geminiApiKey, fetchTip]);
  
  // Remove auto-refresh on schedule edits; only scheduled windows or manual taps will refresh


  // No hourly auto-refresh; controlled by the 5 scheduled windows only
  
  // No manual refresh; card is static and not clickable


  return (
    <>
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
