import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { startOfDay, subDays, addMinutes, getHours, getMinutes } from 'date-fns';
import type { TimeBlock } from '@/types';

interface SuggestedBubble {
  id: string;
  title: string;
  category: TimeBlock['category'];
  duration: number;
  startTime: Date;
  confidence: number;
  color: TimeBlock['color'];
}

interface AutoScheduleState {
  suggestedBubbles: SuggestedBubble[];
  isAnalyzing: boolean;
  activeSuggestionIndex: number;
  showSuggestions: boolean;
  hoverTimeout: NodeJS.Timeout | null;
  ignoredSuggestions: Set<string>;
}

const initialState: AutoScheduleState = {
  suggestedBubbles: [],
  isAnalyzing: false,
  activeSuggestionIndex: 0,
  showSuggestions: false,
  hoverTimeout: null,
  ignoredSuggestions: new Set()
};

export function useAutoSchedule() {
  const { user } = useAuth();
  const { getBlocksForDate, timeBlocks, currentDate, addBlockOnDate } = useTimeBubbles();
  const [state, setState] = useState<AutoScheduleState>(initialState);
  const lastAnalysisDate = useRef<string>('');

  // Analyze patterns and generate suggestions when date changes or bubbles are added
  useEffect(() => {
    if (!user) return;
    const dateKey = currentDate.toISOString().split('T')[0];
    if (lastAnalysisDate.current === dateKey) {
      // Check if any suggestions conflict with new bubbles and remove them
      checkAndRemoveConflictingSuggestions();
      return;
    }
    
    generateAutoScheduleSuggestions();
    lastAnalysisDate.current = dateKey;
  }, [user, currentDate, timeBlocks]);

  // Check for conflicts between suggestions and existing bubbles
  const checkAndRemoveConflictingSuggestions = useCallback(() => {
    setState(prev => {
      const filteredSuggestions = prev.suggestedBubbles.filter(suggestion => {
        const suggestionStart = new Date(suggestion.startTime);
        const suggestionEnd = addMinutes(suggestionStart, suggestion.duration);
        
        // Check if any existing bubble conflicts with this suggestion
        const hasConflict = timeBlocks.some(block => {
          const blockStart = new Date(block.startTime);
          const blockEnd = addMinutes(blockStart, block.duration);
          
          return (suggestionStart < blockEnd && suggestionEnd > blockStart);
        });
        
        return !hasConflict;
      });
      
      return {
        ...prev,
        suggestedBubbles: filteredSuggestions,
        activeSuggestionIndex: Math.min(prev.activeSuggestionIndex, filteredSuggestions.length - 1)
      };
    });
  }, [timeBlocks]);

  const generateAutoScheduleSuggestions = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      // Get historical data for pattern analysis
      const historicalBlocks: TimeBlock[] = [];
      const today = startOfDay(new Date());
      
      for (let i = 1; i <= 14; i++) { // Last 14 days
        const date = subDays(today, i);
        const blocks = await getBlocksForDate(date);
        historicalBlocks.push(...blocks);
      }

      // If no historical data, create sample suggestions
      if (historicalBlocks.length === 0) {
        const sampleSuggestions = createSampleSuggestions();
        setState(prev => ({ 
          ...prev, 
          suggestedBubbles: sampleSuggestions,
          isAnalyzing: false,
          showSuggestions: false // Don't show immediately
        }));
        return;
      }

      // Analyze patterns and generate suggestions
      const suggestions = analyzeAndSuggest(historicalBlocks, timeBlocks);
      
      setState(prev => ({ 
        ...prev, 
        suggestedBubbles: suggestions,
        isAnalyzing: false,
        showSuggestions: false // Don't show immediately
      }));
    } catch (error) {
      console.error('Error generating auto-schedule suggestions:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [user, getBlocksForDate, timeBlocks]);

  const createSampleSuggestions = (): SuggestedBubble[] => {
    const now = new Date();
    const currentHour = getHours(now);
    const suggestions: SuggestedBubble[] = [];

    // Morning work suggestion (9 AM if it's before 9 AM)
    if (currentHour < 9) {
      suggestions.push({
        id: 'sample-work-morning',
        title: 'Morning Focus Work',
        category: 'work',
        duration: 90,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
        confidence: 0.8,
        color: 'indigo'
      });
    }

    // Afternoon study suggestion (2 PM if it's before 2 PM)
    if (currentHour < 14) {
      suggestions.push({
        id: 'sample-study-afternoon',
        title: 'Learning Session',
        category: 'study',
        duration: 60,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30),
        confidence: 0.7,
        color: 'teal'
      });
    }

    // Evening personal time (7 PM if it's before 7 PM)
    if (currentHour < 19) {
      suggestions.push({
        id: 'sample-personal-evening',
        title: 'Personal Project',
        category: 'personal',
        duration: 45,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0),
        confidence: 0.6,
        color: 'lavender'
      });
    }

    return suggestions;
  };

  const analyzeAndSuggest = (historicalBlocks: TimeBlock[], existingBlocks: TimeBlock[]): SuggestedBubble[] => {
    // Group blocks by category and time patterns
    const categoryPatterns = new Map<string, { times: number[], durations: number[], titles: string[] }>();
    
    historicalBlocks.forEach(block => {
      const hour = getHours(new Date(block.startTime));
      const key = block.category;
      
      if (!categoryPatterns.has(key)) {
        categoryPatterns.set(key, { times: [], durations: [], titles: [] });
      }
      
      const pattern = categoryPatterns.get(key)!;
      pattern.times.push(hour);
      pattern.durations.push(block.duration);
      pattern.titles.push(block.title);
    });

    const suggestions: SuggestedBubble[] = [];
    const now = new Date();
    const currentHour = getHours(now);

    // Generate suggestions based on patterns
    for (const [category, pattern] of categoryPatterns.entries()) {
      if (pattern.times.length < 2) continue; // Need at least 2 occurrences
      
      // Find most common time
      const timeFreq = new Map<number, number>();
      pattern.times.forEach(time => {
        timeFreq.set(time, (timeFreq.get(time) || 0) + 1);
      });
      
      const mostCommonTime = Array.from(timeFreq.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Only suggest if the time hasn't passed and slot is available
      if (mostCommonTime > currentHour) {
        const suggestedStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), mostCommonTime, 0);
        const avgDuration = Math.round(pattern.durations.reduce((a, b) => a + b, 0) / pattern.durations.length);
        
        // Check if slot is available
        const isSlotFree = !existingBlocks.some(block => {
          const blockStart = new Date(block.startTime);
          const blockEnd = addMinutes(blockStart, block.duration);
          const suggestionEnd = addMinutes(suggestedStartTime, avgDuration);
          
          return (suggestedStartTime < blockEnd && suggestionEnd > blockStart);
        });

        if (isSlotFree) {
          // Get most common title
          const titleFreq = new Map<string, number>();
          pattern.titles.forEach(title => {
            titleFreq.set(title, (titleFreq.get(title) || 0) + 1);
          });
          const mostCommonTitle = Array.from(titleFreq.entries())
            .sort((a, b) => b[1] - a[1])[0][0];

          suggestions.push({
            id: `suggestion-${category}-${mostCommonTime}`,
            title: mostCommonTitle,
            category: category as TimeBlock['category'],
            duration: avgDuration,
            startTime: suggestedStartTime,
            confidence: timeFreq.get(mostCommonTime)! / pattern.times.length,
            color: getCategoryColor(category as TimeBlock['category'])
          });
        }
      }
    }

    // Return only the highest confidence suggestion that hasn't been ignored
    const sortedSuggestions = suggestions.sort((a, b) => b.confidence - a.confidence);
    const availableSuggestions = sortedSuggestions.filter(s => !state.ignoredSuggestions.has(s.id));
    return availableSuggestions.slice(0, 1); // Only one suggestion at a time
  };

  const getCategoryColor = (category: TimeBlock['category']): TimeBlock['color'] => {
    const colorMap: Record<TimeBlock['category'], TimeBlock['color']> = {
      work: 'indigo',
      study: 'teal',
      personal: 'lavender',
      health: 'emerald',
      break: 'amber'
    };
    return colorMap[category] || 'lavender';
  };

  const acceptSuggestion = useCallback(async (suggestionIndex: number) => {
    const suggestion = state.suggestedBubbles[suggestionIndex];
    if (!suggestion) return;

    try {
      // Ensure startTime is a valid Date object
      const startTime = suggestion.startTime instanceof Date 
        ? suggestion.startTime 
        : new Date(suggestion.startTime);
      
      // Validate the date
      if (isNaN(startTime.getTime())) {
        console.error('Invalid startTime for suggestion:', suggestion);
        return;
      }

      // Add the suggested bubble to the timeline
      await addBlockOnDate({
        title: suggestion.title,
        description: '',
        duration: suggestion.duration,
        category: suggestion.category,
        color: suggestion.color,
        startTime: startTime
      }, currentDate);

      // Remove the accepted suggestion
      setState(prev => ({
        ...prev,
        suggestedBubbles: prev.suggestedBubbles.filter((_, index) => index !== suggestionIndex),
        activeSuggestionIndex: Math.min(prev.activeSuggestionIndex, prev.suggestedBubbles.length - 2)
      }));
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    }
  }, [state.suggestedBubbles, currentDate, addBlockOnDate]);

  const navigateSuggestions = useCallback((direction: 'up' | 'down') => {
    setState(prev => {
      if (prev.suggestedBubbles.length === 0) return prev;
      
      let newIndex;
      if (direction === 'up') {
        newIndex = prev.activeSuggestionIndex <= 0 
          ? prev.suggestedBubbles.length - 1 
          : prev.activeSuggestionIndex - 1;
      } else {
        newIndex = prev.activeSuggestionIndex >= prev.suggestedBubbles.length - 1 
          ? 0 
          : prev.activeSuggestionIndex + 1;
      }
      
      return { ...prev, activeSuggestionIndex: newIndex };
    });
  }, []);

  const dismissSuggestion = useCallback((suggestionIndex: number) => {
    const suggestion = state.suggestedBubbles[suggestionIndex];
    if (suggestion) {
      setState(prev => ({
        ...prev,
        suggestedBubbles: prev.suggestedBubbles.filter((_, index) => index !== suggestionIndex),
        activeSuggestionIndex: Math.min(prev.activeSuggestionIndex, prev.suggestedBubbles.length - 2),
        ignoredSuggestions: new Set([...prev.ignoredSuggestions, suggestion.id])
      }));
    }
  }, [state.suggestedBubbles]);

  const showSuggestionsOnHover = useCallback(() => {
    setState(prev => {
      if (prev.hoverTimeout) {
        clearTimeout(prev.hoverTimeout);
      }
      return {
        ...prev,
        showSuggestions: true,
        hoverTimeout: null
      };
    });
  }, []);

  const hideSuggestionsWithDelay = useCallback(() => {
    setState(prev => {
      if (prev.hoverTimeout) {
        clearTimeout(prev.hoverTimeout);
      }
      const timeout = setTimeout(() => {
        setState(current => ({ ...current, showSuggestions: false, hoverTimeout: null }));
      }, 2000); // Hide after 2 seconds of no interaction
      
      return {
        ...prev,
        hoverTimeout: timeout
      };
    });
  }, []);

  const keepSuggestionsVisible = useCallback(() => {
    setState(prev => {
      if (prev.hoverTimeout) {
        clearTimeout(prev.hoverTimeout);
      }
      return {
        ...prev,
        hoverTimeout: null
      };
    });
  }, []);

  return {
    suggestedBubbles: state.suggestedBubbles,
    isAnalyzing: state.isAnalyzing,
    activeSuggestionIndex: state.activeSuggestionIndex,
    showSuggestions: state.showSuggestions,
    ignoredSuggestions: state.ignoredSuggestions,
    acceptSuggestion,
    navigateSuggestions,
    dismissSuggestion,
    showSuggestionsOnHover,
    hideSuggestionsWithDelay,
    keepSuggestionsVisible,
    refreshSuggestions: generateAutoScheduleSuggestions
  };
}
