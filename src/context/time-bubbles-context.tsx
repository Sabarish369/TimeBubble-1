
'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import type { TimeBlock, BubbleTemplate, DailyInsights, DailyTips, DailySidebarTip, DailySidebarTipInput } from '@/types';
import { getDailyInsights as fetchDailyInsights } from '@/ai/flows/daily-insights';
import { getDailyTips as fetchDailyTips } from '@/ai/flows/daily-tips';
import { getDailySidebarTip } from '@/ai/flows/daily-sidebar-tip';
import { useToast } from '@/hooks/use-toast';
import { MAX_ZOOM, MIN_ZOOM } from '@/lib/constants';
import { addDays, format, startOfDay, isToday, isPast } from 'date-fns';
import * as NotificationManager from '@/lib/notification-manager';
import { useAuth } from './auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';

type Theme = 'light' | 'dark';

export interface MissedTaskGroup {
    date: string;
    tasks: TimeBlock[];
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
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
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
const THEME_STORAGE_KEY = 'timebubble_theme';

const ensureDateObject = (date: any): Date => {
    if (date instanceof Date) {
        return date;
    }
    // Firestore Timestamps have toDate(), strings and numbers can be passed to new Date()
    if (date && typeof date.toDate === 'function') {
        return date.toDate();
    }
    return new Date(date);
};


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
  const { user } = useAuth();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [history, setHistory] = useState<{ [dateKey: string]: TimeBlock[][] }>({});
  const [historyIndex, setHistoryIndex] = useState<{ [dateKey: string]: number }>({});

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

  const { toast } = useToast();

   useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        NotificationManager.requestPermission();
      }
    }
  }, []);

  const updateHistory = useCallback((date: Date, newBlocks: TimeBlock[]) => {
    const dateKey = getDayKey(date);
    const dateHistory = history[dateKey] ?? [];
    const dateHistoryIndex = historyIndex[dateKey] ?? -1;

    const newHistoryForDate = dateHistory.slice(0, dateHistoryIndex + 1);
    newHistoryForDate.push(newBlocks);
    
    setHistory(prev => ({ ...prev, [dateKey]: newHistoryForDate }));
    setHistoryIndex(prev => ({ ...prev, [dateKey]: newHistoryForDate.length - 1 }));
  }, [history, historyIndex]);
  
  const setTimeBlocksWithHistory = useCallback((newBlocks: TimeBlock[] | ((prev: TimeBlock[]) => TimeBlock[])) => {
    setTimeBlocks(prevBlocks => {
      const updatedBlocks = typeof newBlocks === 'function' ? newBlocks(prevBlocks) : newBlocks;
      updateHistory(currentDate, updatedBlocks);
      return updatedBlocks;
    });
  }, [updateHistory, currentDate]);
  
  const saveTimeBlocksToFirestore = useCallback(async (blocks: TimeBlock[], date: Date) => {
    if (!user) return;
    const dateKey = getDayKey(date);
    const dayDocRef = doc(db, 'users', user.uid, 'daily_data', dateKey);
    const blocksToSave = blocks.map(b => ({ ...b, startTime: ensureDateObject(b.startTime).toISOString() }));
    await setDoc(dayDocRef, { blocks: blocksToSave }, { merge: true });
  }, [user]);

  useEffect(() => {
    const dateKey = getDayKey(currentDate);
    if (!history[dateKey] && timeBlocks.length > 0) {
        setHistory(prev => ({ ...prev, [dateKey]: [timeBlocks] }));
        setHistoryIndex(prev => ({ ...prev, [dateKey]: 0 }));
    }
  }, [timeBlocks, currentDate, history]);
  
  const getDailyTips = useCallback(async () => {
    setIsLoadingTips(true);
    try {
        const sortedBlocks = timeBlocks
            .map(b => ({ ...b, startTime: ensureDateObject(b.startTime) }))
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        const now = new Date();
        const completedBlock = lastCompletedBlock;
        const nextTask = sortedBlocks.find(b => b.startTime > now && !b.completed);

        const input = {
            schedule: JSON.stringify({ completedBlock, nextTask }),
            productivityPatterns: "User tends to be most productive in the morning and after short breaks.",
            currentTime: now.toISOString(),
        };

        const result = await fetchDailyTips(input);
        
        if (result.tips && result.tips.length > 0) {
            setDailyTips(result);
            const randomTip = result.tips[Math.floor(Math.random() * result.tips.length)];
            toast({
                title: randomTip.type,
                description: randomTip.suggestion,
                variant: 'dark',
                tipType: randomTip.type,
            });
        } else {
            setDailyTips(null);
        }
    } catch (error) {
        console.error('Error getting AI proactive tip:', error);
        toast({
            title: 'AI Tip Error',
            description: 'Could not fetch a tip right now.',
            variant: 'destructive',
        });
        setDailyTips(null);
    } finally {
        setIsLoadingTips(false);
    }
  }, [toast, timeBlocks, lastCompletedBlock, setDailyTips, setIsLoadingTips]);


  useEffect(() => {
    if (lastCompletedBlock) {
      getDailyTips();
      setLastCompletedBlock(null); 
    }
  }, [lastCompletedBlock, getDailyTips]);

  const updateBlock = useCallback((id: string, updates: Partial<TimeBlock>) => {
    setTimeBlocksWithHistory(prev => {
        const blockIndex = prev.findIndex(b => b.id === id);
        if (blockIndex === -1) return prev;
        
        const existingBlock = prev[blockIndex];
        const updatedBlock = { ...existingBlock, ...updates };

        if (updates.startTime) {
            const resolvedStartTime = findAvailableSlot(updates.startTime, updatedBlock.duration, prev, id);
            updatedBlock.startTime = resolvedStartTime;
        }

        const newBlocks = [...prev];
        newBlocks[blockIndex] = updatedBlock;

        if (updates.completed && !existingBlock.completed) {
            setLastCompletedBlock(updatedBlock);
        }

        return newBlocks;
    });
  }, [setTimeBlocksWithHistory]);
  
  useEffect(() => {
    const onNotify = (block: TimeBlock) => {
      playNotificationSound();
      updateBlock(block.id, { notified: true, actionable: true, notificationScheduled: false });
      setActionableBlock(block);
    };

    NotificationManager.clearAllNotifications();

    timeBlocks.forEach(block => {
      if (block.completed || block.notificationScheduled) return;
      
      const endTime = new Date(ensureDateObject(block.startTime).getTime() + block.duration * 60000);
      if (endTime > new Date()) {
        NotificationManager.scheduleNotification(block, endTime, onNotify);
        updateBlock(block.id, { notificationScheduled: true });
      }
    });

  }, [timeBlocks, updateBlock]);
  
  useEffect(() => {
      if (!user || !isLoaded) return;
      const debouncedSave = setTimeout(() => {
          saveTimeBlocksToFirestore(timeBlocks, currentDate);
      }, 1000);

      return () => clearTimeout(debouncedSave);
  }, [timeBlocks, currentDate, user, isLoaded, saveTimeBlocksToFirestore]);


  useEffect(() => {
    if (!user || !db) {
        setIsLoaded(true);
        return;
    }

    const dateKey = getDayKey(currentDate);
    const dayDocRef = doc(db, 'users', user.uid, 'daily_data', dateKey);

    const unsubscribe = onSnapshot(dayDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const blocksFromDb = data.blocks.map((b: any) => ({...b, startTime: ensureDateObject(b.startTime)}));
            setTimeBlocks(blocksFromDb);
        } else {
            setTimeBlocks([]);
        }
        setIsLoaded(true);
    }, (error) => {
        console.error("Error listening to day data:", error);
        toast({ title: 'Connection Error', description: 'Could not sync your data.', variant: 'destructive' });
        setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user, currentDate, toast]);

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
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (storedTheme) {
        setThemeState(storedTheme);
      } else if (!storedTheme) {
        setThemeState('dark');
      }
    }
  }, [isLoaded, zoomLevel]);

  
  useEffect(() => {
    if(isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(ZOOM_STORAGE_KEY, String(zoomLevel));
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [zoomLevel, theme, isLoaded]);

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }
  }, [theme]);
  
  const findAvailableSlot = useCallback((requestedStartTime: Date, duration: number, blocksToCheck: TimeBlock[], excludeId?: string): Date => {
    const getEndTime = (start: Date, dur: number) => new Date(start.getTime() + dur * 60000);
    let resolvedStartTime = ensureDateObject(requestedStartTime);
  
    while (true) {
        const resolvedEndTime = getEndTime(resolvedStartTime, duration);
        const collidingBlock = blocksToCheck.find(block => {
            if (block.id === excludeId) return false;
            const blockStartTime = ensureDateObject(block.startTime);
            const blockEndTime = getEndTime(blockStartTime, block.duration);
            return resolvedStartTime < blockEndTime && resolvedEndTime > blockStartTime;
        });

        if (!collidingBlock) {
            break;
        }

        const collidingEndTime = getEndTime(ensureDateObject(collidingBlock.startTime), collidingBlock.duration);
        resolvedStartTime = new Date(collidingEndTime);
    }
  
    return resolvedStartTime;
  }, []);

  
  const addBlockOnDate = useCallback(async (block: Omit<TimeBlock, 'id' | 'completed'>, date: Date) => {
    if (!user) {
        toast({ title: 'Not signed in', description: 'You must be signed in to add bubbles.', variant: 'destructive'});
        return;
    }
    const dateKey = getDayKey(date);
    const dayDocRef = doc(db, 'users', user.uid, 'daily_data', dateKey);
    
    try {
        const docSnap = await getDoc(dayDocRef);
        const blocksForDate: TimeBlock[] = docSnap.exists()
            ? docSnap.data().blocks.map((b: any) => ({ ...b, startTime: ensureDateObject(b.startTime) }))
            : [];
            
        const newStartTime = findAvailableSlot(block.startTime, block.duration, blocksForDate);
        const newBlock: TimeBlock = { ...block, startTime: newStartTime, id: crypto.randomUUID(), completed: false, notified: false, actionable: false };
        
        await setDoc(dayDocRef, { blocks: [...blocksForDate.map(b => ({...b, startTime: ensureDateObject(b.startTime)})), newBlock] });

        if (dateKey === getDayKey(currentDate)) {
            setTimeBlocksWithHistory(prev => [...prev, newBlock]);
        }
        
        toast({
          title: 'Bubble Added',
          description: `"${block.title}" added to ${format(date, 'MMMM do')}.`
        });

    } catch (error) {
        console.error("Error adding block:", error);
        toast({ title: "Error", description: "Could not add the time bubble.", variant: "destructive"});
    }
  }, [user, findAvailableSlot, setTimeBlocksWithHistory, currentDate, toast]);

  const addBlock = useCallback((block: Omit<TimeBlock, 'id' | 'completed'>) => {
    addBlockOnDate(block, block.startTime);
  }, [addBlockOnDate]);


  const deleteBlock = useCallback((id: string) => {
    NotificationManager.clearNotification(id);
    setTimeBlocksWithHistory(prev => prev.filter(b => b.id !== id));
  }, [setTimeBlocksWithHistory]);
  
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
    setTimeBlocksWithHistory([]);
  }, [setTimeBlocksWithHistory]);

  const duplicateBlock = useCallback((id: string) => {
    const blockToDuplicate = timeBlocks.find(b => b.id === id);
    if(blockToDuplicate) {
      const newBlockData = {
        ...blockToDuplicate,
        id: crypto.randomUUID(),
        title: `${blockToDuplicate.title} (copy)`,
        startTime: new Date(ensureDateObject(blockToDuplicate.startTime).getTime() + (blockToDuplicate.duration * 60000)),
      }
      addBlock(newBlockData);
    }
  }, [timeBlocks, addBlock]);

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
        const allDaysCollection = collection(db, 'users', user.uid, 'daily_data');
        const querySnapshot = await getDocs(allDaysCollection);
        
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
        batch.set(targetDayDocRef, { blocks: [...blocksForNewDate.map(b => ({...b, startTime: ensureDateObject(b.startTime)})), rescheduledBlockData] }, { merge: true });
        if (sourceBlocks.length > 0) {
            batch.set(sourceDayDocRef, { blocks: sourceBlocks });
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

  const getBlocksForDate = async (date: Date): Promise<TimeBlock[]> => {
    if (!user) return [];
    const dayKey = getDayKey(date);
    const dayDocRef = doc(db, 'users', user.uid, 'daily_data', dayKey);
    try {
        const docSnap = await getDoc(dayDocRef);
        if (docSnap.exists()) {
            return docSnap.data().blocks.map((b: any) => ({...b, startTime: ensureDateObject(b.startTime)}));
        }
        return [];
    } catch (error) {
        console.error("Error fetching blocks for date:", error);
        return [];
    }
  };
  
  const getDailyInsights = async () => {
    setIsLoadingInsights(true);
    setDailyInsights(null);
    try {
      const dailyData = getBlocksForSuggestions();
      const result = await fetchDailyInsights({ dailyData });
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
    const result = await getDailySidebarTip(input);
    return result;
  }, []);
  
  const getMissedTasks = async (): Promise<MissedTaskGroup[]> => {
    if (!user) return [];

    const allDaysCollection = collection(db, 'users', user.uid, 'daily_data');
    const querySnapshot = await getDocs(allDaysCollection);
    
    const now = new Date();
    const missedTasksByDate: Record<string, TimeBlock[]> = {};

    querySnapshot.forEach(docSnap => {
        const blocks = docSnap.data().blocks as any[];
        const missed = blocks.filter(block => {
            const endTime = new Date(ensureDateObject(block.startTime).getTime() + block.duration * 60000);
            return endTime < now && !block.completed;
        });

        if (missed.length > 0) {
            missedTasksByDate[docSnap.id] = missed.map(m => ({...m, startTime: ensureDateObject(m.startTime)}));
        }
    });

    return Object.entries(missedTasksByDate)
        .map(([date, tasks]) => ({ date, tasks }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

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
                      batch.delete(dayDocRef);
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
  
  const setTheme = (newTheme: Theme) => {
    if(theme !== newTheme) {
      setThemeState(newTheme);
    }
  };

  const undo = () => {
    const dateKey = getDayKey(currentDate);
    const dateHistory = history[dateKey] ?? [];
    const dateHistoryIndex = historyIndex[dateKey] ?? -1;
    if (dateHistoryIndex > 0) {
      const newIndex = dateHistoryIndex - 1;
      setHistoryIndex(prev => ({...prev, [dateKey]: newIndex}));
      setTimeBlocks(dateHistory[newIndex]);
    }
  };

  const redo = () => {
    const dateKey = getDayKey(currentDate);
    const dateHistory = history[dateKey] ?? [];
    const dateHistoryIndex = historyIndex[dateKey] ?? -1;
    if (dateHistoryIndex < dateHistory.length - 1) {
      const newIndex = dateHistoryIndex + 1;
      setHistoryIndex(prev => ({...prev, [dateKey]: newIndex}));
      setTimeBlocks(dateHistory[newIndex]);
    }
  };
  
  const setCurrentDate = (date: Date) => {
    if(isLoaded) {
      saveTimeBlocksToFirestore(timeBlocks, currentDate);
    }
    setCurrentDateState(startOfDay(date));
    setIsLoaded(false); // Trigger loading state for new date
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
  const canUndo = (historyIndex[dateKey] ?? 0) > 0;
  const canRedo = (historyIndex[dateKey] ?? -1) < (history[dateKey]?.length - 1);

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

    

    
