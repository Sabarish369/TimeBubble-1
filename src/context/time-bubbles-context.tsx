'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { TimeBlock } from '@/types';
import { getSmartSuggestions } from '@/ai/flows/smart-suggestions';
import { useToast } from '@/hooks/use-toast';

interface TimeBubblesContextType {
  timeBlocks: TimeBlock[];
  isLoaded: boolean;
  addBlock: (block: Omit<TimeBlock, 'id' | 'completed'>) => void;
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  getBlocksForSuggestions: () => string;
  getAiSuggestions: () => Promise<void>;
  suggestions: string[];
  isLoadingSuggestions: boolean;
  clearSuggestions: () => void;
  reflectingBlock: TimeBlock | null;
  setReflectingBlock: (block: TimeBlock | null) => void;
}

const TimeBubblesContext = createContext<TimeBubblesContextType | undefined>(undefined);

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const TimeBubblesProvider = ({ children }: { children: ReactNode }) => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [reflectingBlock, setReflectingBlock] = useState<TimeBlock | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedData = localStorage.getItem('timebubble_data');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const todayKey = getTodayKey();
          const todaysBlocks = parsedData.daily_data?.[todayKey] ?? [];
          const blocksWithDates = todaysBlocks.map((block: any) => ({
            ...block,
            startTime: new Date(block.startTime),
            reflection: block.reflection ? { ...block.reflection, timestamp: new Date(block.reflection.timestamp) } : undefined,
          }));
          setTimeBlocks(blocksWithDates);
        }
      } catch (error) {
        console.error('Failed to load from localStorage', error);
        toast({
          title: 'Error',
          description: 'Could not load your saved data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoaded(true);
      }
    }
  }, [toast]);
  
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
  
    const debounceSave = setTimeout(() => {
      try {
        const storedData = localStorage.getItem('timebubble_data');
        const allData = storedData ? JSON.parse(storedData) : { user_preferences: {}, daily_data: {} };
        const todayKey = getTodayKey();
        allData.daily_data[todayKey] = timeBlocks;
        localStorage.setItem('timebubble_data', JSON.stringify(allData));
      } catch (error) {
        console.error('Failed to save to localStorage', error);
        toast({
          title: 'Error',
          description: 'Could not save your changes.',
          variant: 'destructive',
        });
      }
    }, 500);
  
    return () => clearTimeout(debounceSave);
  }, [timeBlocks, isLoaded, toast]);
  

  const addBlock = useCallback((block: Omit<TimeBlock, 'id' | 'completed'>) => {
    setTimeBlocks(prev => [...prev, { ...block, id: crypto.randomUUID(), completed: false }]);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<TimeBlock>) => {
    setTimeBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    const blockToDuplicate = timeBlocks.find(b => b.id === id);
    if(blockToDuplicate) {
      const newStartTime = new Date(blockToDuplicate.startTime.getTime() + blockToDuplicate.duration * 60000);
      addBlock({
        ...blockToDuplicate,
        title: `${blockToDuplicate.title} (copy)`,
        startTime: newStartTime,
      });
    }
  }, [timeBlocks, addBlock]);

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

  const value = {
    timeBlocks,
    isLoaded,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    getBlocksForSuggestions,
    getAiSuggestions,
    suggestions,
    isLoadingSuggestions,
    clearSuggestions,
    reflectingBlock,
    setReflectingBlock,
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
