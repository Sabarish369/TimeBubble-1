'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { TimeBlock, BubbleTemplate } from '@/types';
import { getSmartSuggestions } from '@/ai/flows/smart-suggestions';
import { useToast } from '@/hooks/use-toast';

interface TimeBubblesContextType {
  timeBlocks: TimeBlock[];
  templates: BubbleTemplate[];
  isLoaded: boolean;
  addBlock: (block: Omit<TimeBlock, 'id' | 'completed'>) => void;
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  clearAllBlocks: () => void;
  addTemplate: (template: Omit<BubbleTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  getBlocksForSuggestions: () => string;
  getAiSuggestions: () => Promise<void>;
  suggestions: string[];
  isLoadingSuggestions: boolean;
  clearSuggestions: () => void;
  reflectingBlock: TimeBlock | null;
  setReflectingBlock: (block: TimeBlock | null) => void;
  selectedBlock: TimeBlock | null;
  setSelectedBlock: (block: TimeBlock | null) => void;
}

const TimeBubblesContext = createContext<TimeBubblesContextType | undefined>(undefined);

const getTodayKey = () => new Date().toISOString().split('T')[0];
const STORAGE_KEY = 'timebubble_data';

export const TimeBubblesProvider = ({ children }: { children: ReactNode }) => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [templates, setTemplates] = useState<BubbleTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [reflectingBlock, setReflectingBlock] = useState<TimeBlock | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedData = localStorage.getItem(STORAGE_KEY);
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

          const customTemplates = parsedData.custom_templates ?? [];
          setTemplates(customTemplates);
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
  
  const saveData = useCallback(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : { user_preferences: {}, daily_data: {}, custom_templates: [] };
      const todayKey = getTodayKey();
      
      allData.daily_data[todayKey] = timeBlocks;
      allData.custom_templates = templates;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    } catch (error) {
      console.error('Failed to save to localStorage', error);
      toast({
        title: 'Error',
        description: 'Could not save your changes.',
        variant: 'destructive',
      });
    }
  }, [timeBlocks, templates, isLoaded, toast]);
  
  useEffect(() => {
    const debounceSave = setTimeout(() => {
        saveData();
    }, 500);
  
    return () => clearTimeout(debounceSave);
  }, [saveData]);
  

  const addBlock = useCallback((block: Omit<TimeBlock, 'id' | 'completed'>) => {
    setTimeBlocks(prev => [...prev, { ...block, id: crypto.randomUUID(), completed: false }]);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<TimeBlock>) => {
    setTimeBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const clearAllBlocks = useCallback(() => {
    setTimeBlocks([]);
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

  const addTemplate = useCallback((template: Omit<BubbleTemplate, 'id'>) => {
    setTemplates(prev => [...prev, { ...template, id: crypto.randomUUID() }]);
    toast({
        title: 'Template Created',
        description: `"${template.title}" has been added to your templates.`,
    });
  }, [toast]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({
        title: 'Template Deleted',
        description: 'The template has been removed.',
    });
  }, [toast]);

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
    templates,
    isLoaded,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    clearAllBlocks,
    addTemplate,
    deleteTemplate,
    getBlocksForSuggestions,
    getAiSuggestions,
    suggestions,
    isLoadingSuggestions,
    clearSuggestions,
    reflectingBlock,
    setReflectingBlock,
    selectedBlock,
    setSelectedBlock,
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
