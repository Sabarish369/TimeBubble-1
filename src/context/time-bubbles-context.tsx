'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import type { TimeBlock, BubbleTemplate, DailyInsights, DailyTips, DailySidebarTip, DailySidebarTipInput, UserPreferences, HabitSuggestion, EnergyTracking, EnergyLevel } from '@/types';
import { getDailyInsights as fetchDailyInsights } from '@/ai/flows/daily-insights';
import { getDailyTips as fetchDailyTips } from '@/ai/flows/daily-tips';
import { getDailySidebarTip } from '@/ai/flows/daily-sidebar-tip';
import { getHabitStackingSuggestions } from '@/ai/flows/habit-stacking';
import { getEnergyOptimizationSuggestions } from '@/ai/flows/energy-optimization';
import { useToast } from '@/hooks/use-toast';
import { MAX_ZOOM, MIN_ZOOM } from '@/lib/constants';
import { addDays, format, startOfDay, isToday, isPast, subDays } from 'date-fns';
import * as NotificationManager from '@/lib/notification-manager';
import { useAuth } from './auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, deleteDoc, writeBatch, Timestamp, query, where } from 'firebase/firestore';
import { ensureDateObject } from '@/lib/time-bubbles-utils';
import { scheduleNotificationsForBubble, clearNotificationsForBubble } from '@/lib/notification-scheduler';
import { startNotificationProcessor } from '@/lib/notification-processor';
import { useNotifications } from '@/hooks/use-notifications';

type Theme = 'light' | 'dark';

export interface MissedTaskGroup {
    date: string;
    tasks: TimeBlock[];
}

export interface EnergyData {
    timestamp: Date;
    level: EnergyLevel;
    context?: string;
}

interface HistoryState {
  [dateKey: string]: {
    snapshots: TimeBlock[][];
    index: number;
  };
}

interface TimeBubblesContextType {
  timeBlocks: TimeBlock[];
  templates: BubbleTemplate[];
  isLoaded: boolean;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  goToToday: () => void;
  goToNextDay: () => void;
  goToPreviousDay: () => void;
  addBlock: (block: Omit<TimeBlock, 'id' | 'completed'>) => void;
  addBlockOnDate: (block: Omit<TimeBlock, 'id' | 'completed'>, date: Date) => void;
  updateBlock: (id: string, updates: Partial<TimeBlock>, saveToDb?: boolean) => void;
  deleteBlock: (id: string) => void;
  deleteBlockFromDate: (id: string, date: Date | string) => void;
  duplicateBlock: (id: string) => void;
  clearAllBlocks: () => void;
  addTemplate: (template: Omit<BubbleTemplate, 'id' | 'isDefault'>) => void;
  updateTemplate: (id: string, updates: Partial<Omit<BubbleTemplate, 'id' | 'isDefault'>>) => void;
  deleteTemplate: (id: string) => void;
  rescheduleBlock: (id: string, newStartTime: Date) => Promise<void>;
  getBlocksForSuggestions: () => string;
  getBlocksForDate: (date: Date) => Promise<TimeBlock[]>;
  getDailyInsights: () => Promise<void>;
  dailyInsights: DailyInsights | null;
  isLoadingInsights: boolean;
  clearDailyInsights: () => void;
  getNewDailySidebarTip: (input: DailySidebarTipInput) => Promise<DailySidebarTip>;
  reflectingBlock: TimeBlock | null;
  setReflectingBlock: (block: TimeBlock | null) => void;
  reschedulingBlock: TimeBlock | null;
  setReschedulingBlock: (block: TimeBlock | null) => void;
  selectedBlock: TimeBlock | null;
  setSelectedBlock: (block: TimeBlock | null) => void;
  actionableBlock: TimeBlock | null;
  setActionableBlock: (block: TimeBlock | null) => void;
  isBubbleCreateModalOpen: boolean;
  setIsBubbleCreateModalOpen: (isOpen: boolean) => void;
  newBubbleStartTime: Date | null;
  setNewBubbleStartTime: (date: Date | null) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getMissedTasks: () => Promise<MissedTaskGroup[]>;
  clearAllMissedTasks: () => Promise<void>;
  getDailyTips: () => Promise<void>;
  dailyTips: DailyTips | null;
  isLoadingTips: boolean;
}

const TimeBubblesContext = createContext<TimeBubblesContextType | undefined>(undefined);

const getDayKey = (date: Date | string) => format(new Date(date), 'yyyy-MM-dd');

const ZOOM_STORAGE_KEY = 'timebubble_zoom';

const playNotificationSound = () => {
    if (typeof window !== 'undefined' && window.AudioContext) {
        const audioContext = new window.AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1);
    }
};

export const TimeBubblesProvider = ({ children }: { children: ReactNode }) => {
  const { user, geminiApiKey } = useAuth();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [history, setHistory] = useState<HistoryState>({});
  const [bubbles, setBubbles] = useState<TimeBubble[]>([]); // State for timeBubbles collection
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date())); // State for the selected date

  const [templates, setTemplates] = useState<BubbleTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentDate, setCurrentDateState] = useState(startOfDay(new Date()));

  const [dailyInsights, setDailyInsights] = useState<DailyInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const [dailyTips, setDailyTips] = useState<DailyTips | null>(null);
  const [isLoadingTips, setIsLoadingTips] = useState(false);

  const [lastCompletedBlock, setLastCompletedBlock] = useState<TimeBlock | null>(null);

  const [reflectingBlock, setReflectingBlock] = useState<TimeBlock | null>(null);
  const [reschedulingBlock, setReschedulingBlock] = useState<TimeBlock | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [actionableBlock, setActionableBlock] = useState<TimeBlock | null>(null);
  const [isBubbleCreateModalOpen, setIsBubbleCreateModalOpen] = useState(false);
  const [newBubbleStartTime, setNewBubbleStartTime] = useState<Date | null>(null);
  const [zoomLevel, setZoomLevelState] = useState(1);
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isMissedTasksDrawerOpen, setIsMissedTasksDrawerOpen] = useState(false);

  const { scheduleTaskNotifications, clearTaskNotifications } = useNotifications();

  const { toast } = useToast();

   useEffect(() => {
    if (typeof window !== 'undefined' && user) {
        NotificationManager.requestPermissionAndGetToken(user.uid);
        NotificationManager.setupForegroundMessageListener();
    }
  }, [user]);

  const saveTimeBlocksToFirestore = useCallback(async (blocks: TimeBlock[], date: Date) => {
    if (!user || !blocks) return;
    const dateKey = getDayKey(date);
    const dayDocRef = doc(db, 'users', user.uid, 'daily_data', dateKey);
    // Ensure all startTimes are converted to string for Firestore serialization
    const blocksToSave = blocks.map(b => ({ ...b, startTime: ensureDateObject(b.startTime).toISOString() }));
    await setDoc(dayDocRef, { blocks: blocksToSave }, { merge: true });
  }, [user]);

  const updateHistory = useCallback((date: Date, newBlocks: TimeBlock[]) => {
    const dateKey = getDayKey(date);
    setHistory(prev => {
        const currentHistory = prev[dateKey] ?? { snapshots: [[]], index: 0 };
        // If we are undoing, we don't want to create a new branch in history
        const newSnapshots = currentHistory.snapshots.slice(0, currentHistory.index + 1);
        newSnapshots.push(newBlocks);

        return {
            ...prev,
            [dateKey]: {
                snapshots: newSnapshots,
                index: newSnapshots.length - 1,
            },
        };
    });
  }, []);

const setTimeBlocksWithHistory = useCallback((newBlocks: TimeBlock[] | ((prev: TimeBlock[]) => TimeBlock[]), date: Date, saveToDb: boolean = false) => {
  let finalBlocks: TimeBlock[] = [];
  setTimeBlocks(prevBlocks => {
      finalBlocks = typeof newBlocks === 'function' ? newBlocks(prevBlocks) : newBlocks;
      return finalBlocks;
  });
  updateHistory(date, finalBlocks);
  if (saveToDb) {
      saveTimeBlocksToFirestore(finalBlocks, date);
  }
}, [updateHistory, saveTimeBlocksToFirestore]);

  const getBlocksForDate = useCallback(async (date: Date): Promise<TimeBlock[]> => {
    if (!user) return [];
    const dayKey = getDayKey(date);
    const dayDocRef = doc(db, 'users', user.uid, 'daily_data', dayKey);
    try {
        const docSnap = await getDoc(dayDocRef);
        if (docSnap.exists()) {
            if (docSnap.data().blocks) {
                return docSnap.data().blocks.map((b: any) => ({...b, startTime: ensureDateObject(b.startTime)}));
            }
        }
        return [];
    } catch (error) {
        console.error("Error fetching blocks for date:", error);
        return [];
    }
  }, [user]);

  const getDailyTips = useCallback(async () => {
    if (!geminiApiKey) return;
    setIsLoadingTips(true);
    setDailyTips(null);
    try {
        const yesterday = subDays(currentDate, 1);
        const previousDayBlocks = await getBlocksForDate(yesterday);

        if (previousDayBlocks.length === 0) {
            toast({
                title: 'Not enough data for tips',
                description: 'Once you complete a day, AI tips will be generated for you here.',
            });
            setIsLoadingTips(false);
            return;
        }

        const schedule = JSON.stringify(previousDayBlocks);
        const productivityPatterns = JSON.stringify(
            previousDayBlocks.filter(b => b.reflection).map(b => ({
                title: b.title,
                mood: b.reflection?.mood,
                productivity: b.reflection?.productivity,
            }))
        );

        const input = {
            schedule,
            productivityPatterns,
            apiKey: geminiApiKey,
        };

        const result = await fetchDailyTips(input);
        setDailyTips(result);
    } catch (error) {
        console.error('Error getting AI proactive tip:', error);
        toast({
            title: 'AI Tip Error',
            description: 'Could not fetch tips for today.',
            variant: 'destructive',
        });
        setDailyTips(null);
    } finally {
        setIsLoadingTips(false);
    }
  }, [geminiApiKey, currentDate, getBlocksForDate, toast]);


  useEffect(() => {
    if (lastCompletedBlock) {
      // The logic to trigger tips immediately after a block is completed has been removed
      // as per the new requirement to generate tips for the next day.
      setLastCompletedBlock(null);
    }
  }, [lastCompletedBlock]);

  const findAvailableSlot = useCallback((
    requestedStartTime: Date,
    duration: number,
    allBlocks: TimeBlock[],
    excludeId?: string
  ): Date => {
    const movingBlockEndTime = new Date(requestedStartTime.getTime() + duration * 60000);
    const otherBlocks = allBlocks.filter(b => b.id !== excludeId);

    const collidingBlocks = otherBlocks.filter(b => {
        const blockStartTime = ensureDateObject(b.startTime);
        const blockEndTime = new Date(blockStartTime.getTime() + b.duration * 60000);
        return requestedStartTime < blockEndTime && movingBlockEndTime > blockStartTime;
    });

    if (collidingBlocks.length === 0) {
        return requestedStartTime;
    }

    // --- Context-aware placement logic ---
    const collisionZoneStart = new Date(Math.min(...collidingBlocks.map(b => ensureDateObject(b.startTime).getTime())));
    const collisionZoneEnd = new Date(Math.max(...collidingBlocks.map(b => new Date(ensureDateObject(b.startTime).getTime() + b.duration * 60000).getTime())));

    const slotBelow = collisionZoneEnd;
    const slotAboveEnd = collisionZoneStart;
    const slotAboveStart = new Date(slotAboveEnd.getTime() - duration * 60000);

    const isBelowFree = !otherBlocks.some(b => {
        const blockStart = ensureDateObject(b.startTime);
        const blockEnd = new Date(blockStart.getTime() + b.duration * 60000);
        const slotBelowEnd = new Date(slotBelow.getTime() + duration * 60000);
        return slotBelow < blockEnd && slotBelowEnd > blockStart;
    });

    const isAboveFree = slotAboveStart >= startOfDay(requestedStartTime) && !otherBlocks.some(b => {
        const blockStart = ensureDateObject(b.startTime);
        const blockEnd = new Date(blockStart.getTime() + b.duration * 60000);
        return slotAboveStart < blockEnd && slotAboveEnd > blockStart;
    });

    if (isAboveFree && isBelowFree) {
        const diffAbove = Math.abs(slotAboveStart.getTime() - requestedStartTime.getTime());
        const diffBelow = Math.abs(slotBelow.getTime() - requestedStartTime.getTime());
        return diffAbove <= diffBelow ? slotAboveStart : slotBelow;
    }

    if (isBelowFree) return slotBelow;
    if (isAboveFree) return slotAboveStart;

    // Fallback if neither adjacent slot is free
    const sortedBlocks = [...otherBlocks].sort((a,b) => ensureDateObject(a.startTime).getTime() - ensureDateObject(b.startTime).getTime());
    let lastEndTime = startOfDay(requestedStartTime);
    for (const block of sortedBlocks) {
        const currentStartTime = ensureDateObject(block.startTime);
        if (currentStartTime.getTime() - lastEndTime.getTime() >= duration * 60000) {
            return lastEndTime;
        }
        lastEndTime = new Date(currentStartTime.getTime() + block.duration * 60000);
    }

    return lastEndTime; // Place at the very end
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<TimeBlock>, saveToDb: boolean = true) => {
    setTimeBlocksWithHistory(prev => {
        const blockIndex = prev.findIndex(b => b.id === id);
        if (blockIndex === -1) return prev;

        let newBlocks = [...prev];
        let updatedBlock = { ...newBlocks[blockIndex], ...updates, startTime: ensureDateObject(updates.startTime ?? newBlocks[blockIndex].startTime) };

        if (updates.completed && !newBlocks[blockIndex].completed) {
            setLastCompletedBlock(updatedBlock);
        }

        // If a drag/resize happened, resolve collisions
        if (saveToDb && (updates.startTime || updates.duration)) {
            const newStartTime = findAvailableSlot(updatedBlock.startTime, updatedBlock.duration, newBlocks, id);
            updatedBlock.startTime = newStartTime;
        }

        newBlocks[blockIndex] = updatedBlock;
        return newBlocks;
    }, currentDate, saveToDb);
  }, [currentDate, setTimeBlocksWithHistory, findAvailableSlot]);

  const getMissedTasks = useCallback(async (): Promise<MissedTaskGroup[]> => {
    if (!user) return [];

    const allDaysCollection = collection(db, 'daily_data'); // Assuming daily_data is at the root, adjust if nested
    const q = query(allDaysCollection, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const now = new Date();
    const missedTasksByDate: Record<string, TimeBlock[]> = {};

    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if(data.blocks) {
            const blocks = data.blocks as any[];
            const missed = blocks.filter(block => {
                const endTime = new Date(ensureDateObject(block.startTime).getTime() + block.duration * 60000);
                return endTime < now && !block.completed;
            });

            if (missed.length > 0) {
                missedTasksByDate[docSnap.id] = missed.map(m => ({...m, startTime: ensureDateObject(m.startTime)}));
            }
        }
    });

    return Object.entries(missedTasksByDate)
        .map(([date, tasks]) => ({ date, tasks }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user]);

  // Effect to check for missed tasks periodically
    useEffect(() => {
        const checkMissedTasks = async () => {
            const missedTasks = await getMissedTasks();
            if (missedTasks.length > 0 && !isMissedTasksDrawerOpen) {
                toast({
                    title: "You have overdue tasks",
                    description: "Open the missed tasks panel to reschedule or review them.",
                });
            }
        };

        const intervalId = setInterval(checkMissedTasks, 30 * 60 * 1000); // Check every 30 minutes

        return () => clearInterval(intervalId);
    }, [isMissedTasksDrawerOpen, toast, getMissedTasks]);


  useEffect(() => {
    if (!user || !db) {
        setIsLoaded(true);
        return;
    }

    const dateKey = getDayKey(currentDate);
    const dayDocRef = doc(db, 'users', user.uid, 'daily_data', dateKey);

    const unsubscribe = onSnapshot(dayDocRef, (docSnap) => {
        // This check prevents Firestore from overwriting local state during an undo/redo action.
        if (docSnap.metadata.hasPendingWrites) {
            return;
        }

        let blocksFromDb: TimeBlock[] = [];
        if (docSnap.exists() && docSnap.data().blocks) {
            blocksFromDb = docSnap.data().blocks.map((b: any) => ({...b, startTime: ensureDateObject(b.startTime)}));
        }

        setTimeBlocks(blocksFromDb);
        // Reset history for the day with the new data from DB
        setHistory(prev => ({
            ...prev,
            [dateKey]: { snapshots: [blocksFromDb], index: 0 }
        }));

        if (!isLoaded) {
            setIsLoaded(true);
        }
    }, (error) => {
        console.error("Error listening to day data:", error);
         if (error.code === 'permission-denied') {
            toast({
                title: 'Permission Error',
                description: 'Could not load daily data. Please check your Firestore security rules.',
                variant: 'destructive',
                duration: 10000,
            });
        } else {
            toast({ title: 'Connection Error', description: 'Could not sync your data.', variant: 'destructive' });
        }
        setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user, currentDate, toast, isLoaded]); // Rerun when user or date changes

  useEffect(() => {
    if (!user || !db) return;
    const templatesDocRef = doc(db, 'users', user.uid, 'settings', 'templates');
    const unsubscribe = onSnapshot(templatesDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setTemplates(docSnap.data().templates ?? []);
        } else {
            setTemplates([]);
        }
    }, (error) => {
        console.error("Error listening to templates:", error);
         if (error.code === 'permission-denied') {
            toast({
                title: 'Permission Error',
                description: 'Could not load templates. Please check your Firestore security rules.',
                variant: 'destructive',
                duration: 10000,
            });
        }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoaded) {
      const storedZoom = localStorage.getItem(ZOOM_STORAGE_KEY);
      if (storedZoom) {
          const newZoom = parseFloat(storedZoom);
          if(zoomLevel !== newZoom) setZoomLevelState(newZoom);
      }
    }
  }, [isLoaded, zoomLevel]);

  // Load user preferences from Firestore
  useEffect(() => {
    if (!user || !db) return;
    const prefsDocRef = doc(db, 'users', user.uid, 'settings', 'preferences');
    const unsubscribe = onSnapshot(prefsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const prefs = docSnap.data() as UserPreferences;
        if (prefs.theme) {
          setThemeState(prefs.theme);
        }
      } else {
        // If no prefs, set default and save
        saveUserPreferences({ theme: 'dark' });
      }
    }, (error) => {
      console.error("Error listening to user preferences:", error);
      if (error.code === 'permission-denied') {
        toast({
          title: 'Permission Error',
          description: 'Could not load your preferences. Please check your Firestore security rules.',
          variant: 'destructive',
          duration: 10000,
        });
      }
    });
    return () => unsubscribe();
  }, [user]);


  useEffect(() => {
    if(isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(ZOOM_STORAGE_KEY, String(zoomLevel));
    }
  }, [zoomLevel, isLoaded]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }
  }, [theme]);

  const addBlockOnDate = useCallback(async (block: Omit<TimeBlock, 'id' | 'completed'>, date: Date) => {
    if (!user) {
        toast({ title: 'Not signed in', description: 'You must be signed in to add bubbles.', variant: 'destructive'});
        return;
    }

    const isCurrentOpenDate = getDayKey(date) === getDayKey(currentDate);
    const blocksForDate = isCurrentOpenDate ? timeBlocks : await getBlocksForDate(date);

    const newStartTime = findAvailableSlot(block.startTime, block.duration, blocksForDate);
    const newBlock: TimeBlock = { ...block, startTime: newStartTime, id: crypto.randomUUID(), completed: false, notified: false, actionable: false, notificationScheduled: false };

    const newBlocks = [...blocksForDate, newBlock];

    if (isCurrentOpenDate) {
        setTimeBlocksWithHistory(newBlocks, date, true);
    } else {
        await saveTimeBlocksToFirestore(newBlocks, date);
    }

    toast({
      title: 'Bubble Added',
      description: `"${block.title}" added to ${format(date, 'MMMM do')}.`
    });
  }, [user, findAvailableSlot, setTimeBlocksWithHistory, toast, currentDate, timeBlocks, getBlocksForDate, saveTimeBlocksToFirestore]);

  const addBlock = useCallback((block: Omit<TimeBlock, 'id' | 'completed'>) => {
    addBlockOnDate(block, block.startTime);
  }, [addBlockOnDate]);


  const deleteBlock = useCallback(async (id: string): Promise<void> => {
    setTimeBlocksWithHistory(prev => prev.filter(b => b.id !== id), currentDate, true);
  }, [currentDate, setTimeBlocksWithHistory]);

  const deleteBlockFromDate = async (id: string, date: Date | string) => {
    if (!user) return;
    const dayKey = getDayKey(date);
    const dayDocRef = doc(db, 'users', user.uid, 'daily_data', dayKey);

    try {
        const docSnap = await getDoc(dayDocRef);
        if (docSnap.exists()) {
            const existingBlocks = docSnap.data().blocks;
            const updatedBlocks = existingBlocks.filter((b: TimeBlock) => b.id !== id);
            await setDoc(dayDocRef, { blocks: updatedBlocks });
        }
    } catch (e) {
        console.error("Failed to delete block from other date", e);
        toast({ title: "Error deleting task", variant: "destructive" });
    }
  };


  const clearAllBlocks = useCallback(() => {
    setTimeBlocksWithHistory([], currentDate, true);
  }, [setTimeBlocksWithHistory, currentDate]);

  const duplicateBlock = useCallback((id: string) => {
    const blockToDuplicate = timeBlocks.find(b => b.id === id);
    if (blockToDuplicate) {
      const newBlockData = {
        title: `${blockToDuplicate.title} (copy)`,
        description: blockToDuplicate.description,
        duration: blockToDuplicate.duration,
        color: blockToDuplicate.color,
        category: blockToDuplicate.category,
        startTime: new Date(ensureDateObject(blockToDuplicate.startTime).getTime() + (blockToDuplicate.duration * 60000)),
      };
      addBlockOnDate(newBlockData, newBlockData.startTime);
    }
  }, [timeBlocks, addBlockOnDate]);

  const saveTemplatesToFirestore = async (newTemplates: BubbleTemplate[]) => {
      if (!user) return;
      const templatesDocRef = doc(db, 'users', user.uid, 'settings', 'templates');
      await setDoc(templatesDocRef, { templates: newTemplates });
  };

  const addTemplate = useCallback((template: Omit<BubbleTemplate, 'id' | 'isDefault'>) => {
    const newTemplate = { ...template, id: crypto.randomUUID(), isDefault: false };
    const newTemplates = [...templates, newTemplate];
    setTemplates(newTemplates);
    saveTemplatesToFirestore(newTemplates);
    toast({
        title: 'Template Created',
        description: `"${template.title}" has been added to your templates.`,
    });
  }, [templates, toast]);

  const updateTemplate = useCallback((id: string, updates: Partial<Omit<BubbleTemplate, 'id' | 'isDefault'>>) => {
    const isDefaultTemplate = defaultTemplates.some(t => t.id === id);
    let newTemplates;

    if (templates.some(t => t.id === id)) {
        newTemplates = templates.map(t => t.id === id ? { ...t, ...updates } : t);
    } else if (isDefaultTemplate) {
        const defaultTemplate = defaultTemplates.find(t => t.id === id)!;
        newTemplates = [...templates, { ...defaultTemplate, ...updates, id }];
    } else {
        return;
    }

    setTemplates(newTemplates);
    saveTemplatesToFirestore(newTemplates);
    toast({
        title: 'Template Updated',
        description: `Your template has been updated.`,
    });
  }, [templates, toast]);

  const deleteTemplate = useCallback((id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    saveTemplatesToFirestore(newTemplates);
    toast({
        title: 'Template Deleted',
        description: 'The template has been removed.',
    });
  }, [templates, toast]);

  const rescheduleBlock = async (id: string, newStartTime: Date) => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be signed in to reschedule.', variant: 'destructive' });
        return;
    }

    try {
        const allDaysCollection = collection(db, 'daily_data'); // Assuming daily_data is at the root
        const q = query(allDaysCollection, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        let blockToReschedule: TimeBlock | null = null;
        let sourceDayKey: string | null = null;

        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            const found = data.blocks.find((b: any) => b.id === id);
            if (found) {
                blockToReschedule = { ...found, startTime: ensureDateObject(found.startTime) };
                sourceDayKey = docSnap.id;
                break;
            }
        }

        if (!blockToReschedule || !sourceDayKey) {
            toast({ title: 'Error', description: 'Could not find the task to reschedule.', variant: 'destructive' });
            return;
        }

        NotificationManager.clearNotification(id);

        const rescheduledBlockData: TimeBlock = {
          ...blockToReschedule,
          startTime: newStartTime,
          notified: false,
          actionable: false,
          completed: false,
          notificationScheduled: false,
        };

        const newDayKey = getDayKey(newStartTime);
        const targetDayDocRef = doc(db, 'users', user.uid, 'daily_data', newDayKey);
        const targetDocSnap = await getDoc(targetDayDocRef);
        const blocksForNewDate = targetDocSnap.exists()
            ? targetDocSnap.data().blocks.map((b: any) => ({ ...b, startTime: ensureDateObject(b.startTime) }))
            : [];

        const resolvedStartTime = findAvailableSlot(newStartTime, rescheduledBlockData.duration, blocksForNewDate);
        rescheduledBlockData.startTime = resolvedStartTime;

        const sourceDayDocRef = doc(db, 'users', user.uid, 'daily_data', sourceDayKey);
        const sourceDocSnap = await getDoc(sourceDayDocRef);
        const sourceBlocks = sourceDocSnap.exists() ? sourceDocSnap.data().blocks.filter((b: any) => b.id !== id) : [];

        const batch = writeBatch(db);
        batch.set(targetDayDocRef, { blocks: [...blocksForNewDate.map(b => ({...b, startTime: ensureDateObject(b.startTime).toISOString()})), {...rescheduledBlockData, startTime: rescheduledBlockData.startTime.toISOString()}] }, { merge: true });
        if (sourceBlocks.length > 0) {
            batch.set(sourceDayDocRef, { blocks: sourceBlocks.map(b => ({...b, startTime: ensureDateObject(b.startTime).toISOString()})) });
        } else {
            batch.delete(sourceDayDocRef);
        }
        await batch.commit();

        toast({
            title: 'Bubble Rescheduled',
            description: `"${rescheduledBlockData.title}" has been moved to the new date and time.`,
        });

    } catch (error) {
       console.error('Failed to reschedule block', error);
       toast({
         title: 'Error',
         description: 'Could not reschedule your time bubble.',
         variant: 'destructive',
       });
    }
  };


  const getBlocksForSuggestions = useCallback(() => {
    return JSON.stringify(timeBlocks.map(b => ({ ...b, id: undefined })));
  }, [timeBlocks]);


  const getDailyInsights = async () => {
    if (!geminiApiKey) return;
    setIsLoadingInsights(true);
    setDailyInsights(null);
    try {
      const dailyData = getBlocksForSuggestions();
      const result = await fetchDailyInsights({ dailyData, apiKey: geminiApiKey });
      setDailyInsights(result);
    } catch (error) {
      console.error('Error getting AI insights:', error);
      toast({
        title: 'AI Error',
        description: 'Could not get daily insights.',
        variant: 'destructive',
      });
      setDailyInsights(null);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const getNewDailySidebarTip = useCallback(async (input: DailySidebarTipInput): Promise<DailySidebarTip> => {
    if (!geminiApiKey) throw new Error("API key is not set.");
    const result = await getDailySidebarTip({ ...input, apiKey: geminiApiKey });
    return result;
  }, [geminiApiKey]);


  const clearAllMissedTasks = async () => {
      if (!user) return;
      try {
          const missedTaskGroups = await getMissedTasks();
          if (missedTaskGroups.length === 0) {
              toast({ title: "No missed tasks to clear."});
              return;
          }
          const batch = writeBatch(db);

          for (const group of missedTaskGroups) {
              const dayDocRef = doc(db, 'users', user.uid, 'daily_data', group.date);
              const docSnap = await getDoc(dayDocRef);

              if (docSnap.exists()) {
                  const allBlocks = docSnap.data().blocks as any[];
                  const remainingBlocks = allBlocks.filter(b => {
                      const missedIds = group.tasks.map(mt => mt.id);
                      return !missedIds.includes(b.id);
                  });

                  if (remainingBlocks.length > 0) {
                      batch.set(dayDocRef, { blocks: remainingBlocks });
                  } else {
                      batch.delete(docSnap.ref);
                  }
              }
          }
          await batch.commit();
          toast({ title: "All missed tasks have been cleared." });
      } catch (e) {
          console.error("Failed to clear all missed tasks", e);
          toast({ title: "Error clearing tasks", variant: "destructive" });
      }
  };

  const clearDailyInsights = () => {
    setDailyInsights(null);
  };

  const setZoomLevel = (level: number) => {
    const newLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
    if(zoomLevel !== newLevel) {
      setZoomLevelState(newLevel);
    }
  };

  const saveUserPreferences = useCallback(async (prefs: Partial<UserPreferences>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, prefs, { merge: true });
  }, [user]);

  const setTheme = (newTheme: Theme) => {
    if(theme !== newTheme) {
      setThemeState(newTheme);
      saveUserPreferences({ theme: newTheme });
    }
  };

  const undo = () => {
    const dateKey = getDayKey(currentDate);
    const dayHistory = history[dateKey];
    if (dayHistory && dayHistory.index > 0) {
      const newIndex = dayHistory.index - 1;
      const newBlocks = dayHistory.snapshots[newIndex];
      setTimeBlocks(newBlocks);
      saveTimeBlocksToFirestore(newBlocks, currentDate);
      setHistory(prev => ({
        ...prev,
        [dateKey]: { ...dayHistory, index: newIndex },
      }));
    }
  };

  const redo = () => {
    const dateKey = getDayKey(currentDate);
    const dayHistory = history[dateKey];
    if (dayHistory && dayHistory.index < dayHistory.snapshots.length - 1) {
      const newIndex = dayHistory.index + 1;
      const newBlocks = dayHistory.snapshots[newIndex];
      setTimeBlocks(newBlocks);
      saveTimeBlocksToFirestore(newBlocks, currentDate);
      setHistory(prev => ({
        ...prev,
        [dateKey]: { ...dayHistory, index: newIndex },
      }));
    }
  };

  const setCurrentDate = (date: Date) => {
    saveTimeBlocksToFirestore(timeBlocks, currentDate);

    setCurrentDateState(startOfDay(date));
    setIsLoaded(false);
    setTimeBlocks([]);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const goToPreviousDay = () => {
    setCurrentDate(addDays(currentDate, -1));
  };

  const dateKey = getDayKey(currentDate);
  const dayHistory = history[dateKey];
  const canUndo = dayHistory ? dayHistory.index > 0 : false;
  const canRedo = dayHistory ? dayHistory.index < dayHistory.snapshots.length - 1 : false;

  const value = {
    timeBlocks,
    templates,
    isLoaded,
    currentDate,
    setCurrentDate,
    goToToday,
    goToNextDay,
    goToPreviousDay,
    addBlock,
    addBlockOnDate,
    updateBlock,
    deleteBlock,
    deleteBlockFromDate,
    duplicateBlock,
    clearAllBlocks,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    rescheduleBlock,
    getBlocksForSuggestions,
    getBlocksForDate,
    getDailyInsights,
    dailyInsights,
    isLoadingInsights,
    clearDailyInsights,
    getNewDailySidebarTip,
    reflectingBlock,
    setReflectingBlock,
    reschedulingBlock,
    setReschedulingBlock,
    selectedBlock,
    setSelectedBlock,
    actionableBlock,
    setActionableBlock,
    isBubbleCreateModalOpen,
    setIsBubbleCreateModalOpen,
    newBubbleStartTime,
    setNewBubbleStartTime,
    zoomLevel,
    setZoomLevel,
    theme,
    setTheme,
    undo,
    redo,
    canUndo,
    canRedo,
    getMissedTasks,
    clearAllMissedTasks,
    getDailyTips,
    dailyTips,
    isLoadingTips,
  };

  return (
    <TimeBubblesContext.Provider value={value}>
      {children}
    </TimeBubblesContext.Provider>
  );
};

export const useTimeBubbles = () => {
  const context = useContext(TimeBubblesContext);
  if (context === undefined) {
    throw new Error('useTimeBubbles must be used within a TimeBubblesProvider');
  }
  return context;
};

const defaultTemplates: BubbleTemplate[] = [
  { id: 'default-1', title: 'Focus Work', description: 'Deep work session on a key project.', category: 'work', duration: 90, color: 'mint', isDefault: true },
  { id: 'default-2', title: 'Study Session', description: 'Review notes and practice problems.', category: 'study', duration: 120, color: 'sky-blue', isDefault: true },
  { id: 'default-3', title: 'Short Break', description: 'Step away from the screen, stretch, or meditate.', category: 'break', duration: 15, color: 'peach', isDefault: true },
  { id: 'default-4', title: 'Workout', description: 'Go for a run, lift weights, or do yoga.', category: 'health', duration: 60, color: 'rose-gold', isDefault: true },
  { id: 'default-5', title: 'Personal Time', description: 'Read a book, work on a hobby, or relax.', category: 'personal', duration: 45, color: 'lavender', isDefault: true },
];
