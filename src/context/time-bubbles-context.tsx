
'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { TimeBlock, BubbleTemplate } from '@/types';
import { getSmartSuggestions } from '@/ai/flows/smart-suggestions';
import { useToast } from '@/hooks/use-toast';
import { MAX_ZOOM, MIN_ZOOM } from '@/lib/constants';
import { addDays, format, startOfDay } from 'date-fns';

type Theme = 'light' | 'dark';

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
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  clearAllBlocks: () => void;
  addTemplate: (template: Omit<BubbleTemplate, 'id' | 'isDefault'>) => void;
  updateTemplate: (id: string, updates: Partial<Omit<BubbleTemplate, 'id' | 'isDefault'>>) => void;
  deleteTemplate: (id: string) => void;
  rescheduleBlock: (id: string, newStartTime: Date) => void;
  getBlocksForSuggestions: () => string;
  getAiSuggestions: () => Promise<void>;
  suggestions: string[];
  isLoadingSuggestions: boolean;
  clearSuggestions: () => void;
  reflectingBlock: TimeBlock | null;
  setReflectingBlock: (block: TimeBlock | null) => void;
  reschedulingBlock: TimeBlock | null;
  setReschedulingBlock: (block: TimeBlock | null) => void;
  selectedBlock: TimeBlock | null;
  setSelectedBlock: (block: TimeBlock | null) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TimeBubblesContext = createContext<TimeBubblesContextType | undefined>(undefined);

const getDayKey = (date: Date) => format(date, 'yyyy-MM-dd');
const STORAGE_KEY = 'timebubble_data';
const ZOOM_STORAGE_KEY = 'timebubble_zoom';
const THEME_STORAGE_KEY = 'timebubble_theme';

export const TimeBubblesProvider = ({ children }: { children: ReactNode }) => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [history, setHistory] = useState<TimeBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [templates, setTemplates] = useState<BubbleTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentDate, setCurrentDateState] = useState(startOfDay(new Date()));
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [reflectingBlock, setReflectingBlock] = useState<TimeBlock | null>(null);
  const [reschedulingBlock, setReschedulingBlock] = useState<TimeBlock | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [zoomLevel, setZoomLevelState] = useState(1);
  const [theme, setThemeState] = useState<Theme>('light');

  const { toast } = useToast();

  // Load data whenever the current date changes
  useEffect(() => {
    if (isLoaded) {
      loadDataForDate(currentDate);
    }
  }, [currentDate, isLoaded]);

  const updateHistory = useCallback((newBlocks: TimeBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  const setTimeBlocksWithHistory = useCallback((newBlocks: TimeBlock[] | ((prev: TimeBlock[]) => TimeBlock[])) => {
    setTimeBlocks(prevBlocks => {
      const updatedBlocks = typeof newBlocks === 'function' ? newBlocks(prevBlocks) : newBlocks;
      updateHistory(updatedBlocks);
      return updatedBlocks;
    });
  }, [updateHistory]);

  const loadDataForDate = useCallback((date: Date) => {
    if (typeof window !== 'undefined') {
      try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const dayKey = getDayKey(date);
          
          const todaysBlocks = parsedData.daily_data?.[dayKey] ?? [];
          const blocksWithDates = todaysBlocks.map((block: any) => ({
            ...block,
            startTime: new Date(block.startTime),
            reflection: block.reflection ? { ...block.reflection, timestamp: new Date(block.reflection.timestamp) } : undefined,
          }));
          setTimeBlocks(blocksWithDates);
          setHistory([blocksWithDates]);
          setHistoryIndex(0);

          const customTemplates = parsedData.custom_templates ?? [];
          setTemplates(customTemplates);
        } else {
            setTimeBlocks([]);
            setHistory([[]]);
            setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Failed to load from localStorage', error);
        toast({
          title: 'Error',
          description: 'Could not load your saved data.',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);


  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoaded) {
      loadDataForDate(currentDate);

      const storedZoom = localStorage.getItem(ZOOM_STORAGE_KEY);
      if (storedZoom) {
          setZoomLevelState(parseFloat(storedZoom));
      }

      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (storedTheme) {
          setThemeState(storedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setThemeState('dark');
      }

      setIsLoaded(true);
    }
  }, [isLoaded, loadDataForDate, currentDate]);
  
  const saveData = useCallback(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : { user_preferences: {}, daily_data: {}, custom_templates: [] };
      const dayKey = getDayKey(currentDate);
      
      allData.daily_data[dayKey] = timeBlocks;
      allData.custom_templates = templates;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      localStorage.setItem(ZOOM_STORAGE_KEY, String(zoomLevel));
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Failed to save to localStorage', error);
      toast({
        title: 'Error',
        description: 'Could not save your changes.',
        variant: 'destructive',
      });
    }
  }, [timeBlocks, templates, isLoaded, toast, zoomLevel, theme, currentDate]);
  
  useEffect(() => {
    const debounceSave = setTimeout(() => {
        saveData();
    }, 500);
  
    return () => clearTimeout(debounceSave);
  }, [saveData]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }
  }, [theme]);
  
  const findAvailableSlot = useCallback((requestedStartTime: Date, duration: number, excludeId?: string): Date => {
    const sortedBlocks = [...timeBlocks]
      .filter(b => b.id !== excludeId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  
    let newStartTime = new Date(requestedStartTime);
  
    for (const block of sortedBlocks) {
      const blockStartTime = block.startTime;
      const blockEndTime = new Date(block.startTime.getTime() + block.duration * 60000);
      const newEndTime = new Date(newStartTime.getTime() + duration * 60000);
      
      if (newStartTime < blockEndTime && newEndTime > blockStartTime) {
        newStartTime = new Date(blockEndTime);
      }
    }
    
    const today = new Date(requestedStartTime);
    today.setHours(0, 0, 0, 0);
    if (newStartTime < today) {
        return today;
    }

    return newStartTime;
  }, [timeBlocks]);


  const addBlock = useCallback((block: Omit<TimeBlock, 'id' | 'completed'>) => {
    setTimeBlocksWithHistory(prev => {
        const newStartTime = findAvailableSlot(block.startTime, block.duration);
        return [...prev, { ...block, startTime: newStartTime, id: crypto.randomUUID(), completed: false }];
    });
  }, [findAvailableSlot, setTimeBlocksWithHistory]);

  const updateBlock = useCallback((id: string, updates: Partial<TimeBlock>) => {
    // This is a special case. Reflections shouldn't be part of the undo/redo history.
    if ('completed' in updates || 'reflection' in updates) {
      setTimeBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
      return;
    }

    setTimeBlocksWithHistory(prev => {
        const originalBlock = prev.find(b => b.id === id);
        if (!originalBlock) return prev;

        const tentativeBlock = { ...originalBlock, ...updates };
        const newStartTime = findAvailableSlot(tentativeBlock.startTime, tentativeBlock.duration, id);

        return prev.map(b => (b.id === id ? { ...b, ...updates, startTime: newStartTime } : b));
    });
  }, [findAvailableSlot, setTimeBlocksWithHistory]);


  const deleteBlock = useCallback((id: string) => {
    setTimeBlocksWithHistory(prev => prev.filter(b => b.id !== id));
  }, [setTimeBlocksWithHistory]);

  const clearAllBlocks = useCallback(() => {
    setTimeBlocksWithHistory([]);
  }, [setTimeBlocksWithHistory]);

  const duplicateBlock = useCallback((id: string) => {
    const blockToDuplicate = timeBlocks.find(b => b.id === id);
    if(blockToDuplicate) {
      const newBlockData = {
        ...blockToDuplicate,
        title: `${blockToDuplicate.title} (copy)`,
        startTime: new Date(blockToDuplicate.startTime.getTime() + (blockToDuplicate.duration * 60000)),
      }
      addBlock(newBlockData);
    }
  }, [timeBlocks, addBlock]);

  const addTemplate = useCallback((template: Omit<BubbleTemplate, 'id' | 'isDefault'>) => {
    setTemplates(prev => [...prev, { ...template, id: crypto.randomUUID(), isDefault: false }]);
    toast({
        title: 'Template Created',
        description: `"${template.title}" has been added to your templates.`,
    });
  }, [toast]);

  const updateTemplate = useCallback((id: string, updates: Partial<Omit<BubbleTemplate, 'id' | 'isDefault'>>) => {
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
    toast({
        title: 'Template Updated',
        description: `Your template has been updated.`,
    });
  }, [toast]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({
        title: 'Template Deleted',
        description: 'The template has been removed.',
    });
  }, [toast]);

  const rescheduleBlock = (id: string, newStartTime: Date) => {
    const blockToReschedule = timeBlocks.find(b => b.id === id);
    if (!blockToReschedule) return;

    const rescheduledBlock = {
      ...blockToReschedule,
      startTime: newStartTime,
    };
    
    // Save to the new date's storage
    const newDayKey = getDayKey(newStartTime);
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : { daily_data: {} };
      if (!allData.daily_data[newDayKey]) {
        allData.daily_data[newDayKey] = [];
      }
      allData.daily_data[newDayKey].push(rescheduledBlock);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));

      // Remove from the current day
      deleteBlock(id);
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
  
  const getAiSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const dailyData = getBlocksForSuggestions();
      const userPreferences = JSON.stringify({ theme: 'light', working_hours: { start: 9, end: 17 } });
      const result = await getSmartSuggestions({ dailyData, userPreferences });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast({
        title: 'AI Error',
        description: 'Could not get smart suggestions.',
        variant: 'destructive',
      });
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  const setZoomLevel = (level: number) => {
    const newZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
    setZoomLevelState(newZoomLevel);
  };
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTimeBlocks(history[newIndex]);
    }
  };

  const redo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTimeBlocks(history[newIndex]);
    }
  };
  
  const setCurrentDate = (date: Date) => {
    setCurrentDateState(startOfDay(date));
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
    updateBlock,
    deleteBlock,
    duplicateBlock,
    clearAllBlocks,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    rescheduleBlock,
    getBlocksForSuggestions,
    getAiSuggestions,
    suggestions,
    isLoadingSuggestions,
    clearSuggestions,
    reflectingBlock,
    setReflectingBlock,
    reschedulingBlock,
    setReschedulingBlock,
    selectedBlock,
    setSelectedBlock,
    zoomLevel,
    setZoomLevel,
    theme,
    setTheme,
    undo,
    redo,
    canUndo,
    canRedo,
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
