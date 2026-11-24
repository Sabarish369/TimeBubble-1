'use client';
import type { DragEvent, MouseEvent, RefObject } from 'react';
import React from 'react';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { HOUR_HEIGHT, TOTAL_HOURS, DEFAULT_BUBBLE_COLOR } from '@/lib/constants';
import { CurrentTimeIndicator } from './current-time-indicator';
import { TimelineGrid } from './timeline-grid';
import { TimeBubble } from './time-bubble';
import { ReflectionModal } from './reflection-modal';
import { BubbleDetailsModal } from './bubble-details-modal';
import { RescheduleModal } from './reschedule-modal';
import { useToast } from '@/hooks/use-toast';
import { GhostBubble } from './ghost-bubble';
import { SuggestedBubble } from './suggested-bubble';
import { useAutoSchedule } from '@/hooks/use-auto-schedule';
import { isToday, isPast, getHours, getMinutes } from 'date-fns';

interface TimelineProps {
  scrollContainerRef: RefObject<HTMLElement>;
}

export function Timeline({ scrollContainerRef }: TimelineProps) {
  const { 
    timeBlocks, 
    addBlock, 
    isLoaded, 
    reflectingBlock, 
    selectedBlock, 
    reschedulingBlock, 
    zoomLevel, 
    currentDate,
    setIsBubbleCreateModalOpen,
    setNewBubbleStartTime
  } = useTimeBubbles();
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const [selectedBubbleId, setSelectedBubbleId] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    setSelectedBubbleId(null);
  }, [currentDate]);
  
  // Auto-schedule suggestions
  const {
    suggestedBubbles,
    isAnalyzing,
    activeSuggestionIndex,
    showSuggestions,
    ignoredSuggestions,
    acceptSuggestion,
    navigateSuggestions,
    dismissSuggestion,
    showSuggestionsOnHover,
    hideSuggestionsWithDelay,
    keepSuggestionsVisible
  } = useAutoSchedule();
  
  // Ghost bubble state
  const [ghostBubble, setGhostBubble] = React.useState<{
    template: any;
    position: { x: number; y: number };
    isVisible: boolean;
  } | null>(null);
  
  // Store current drag template
  const currentDragTemplate = React.useRef<any>(null);

  const hourHeight = HOUR_HEIGHT * zoomLevel;
  const pixelsPerMinute = hourHeight / 60;
  
  // Handle keyboard navigation for suggestions
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestedBubbles.length === 0 || !showSuggestions) return;
      
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          acceptSuggestion(activeSuggestionIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateSuggestions('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateSuggestions('down');
          break;
        case 'Escape':
          dismissSuggestion(activeSuggestionIndex);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestedBubbles, activeSuggestionIndex, showSuggestions, acceptSuggestion, navigateSuggestions, dismissSuggestion]);
  
  // Calculate position and size for suggested bubbles
  const getSuggestedBubbleStyle = (suggestion: any) => {
    const startHour = getHours(suggestion.startTime);
    const startMinute = getMinutes(suggestion.startTime);
    const top = (startHour * hourHeight) + (startMinute * pixelsPerMinute);
    const height = suggestion.duration * pixelsPerMinute;
    
    return {
      top: `${top}px`,
      left: '8px',
      right: '8px',
      height: `${Math.max(height, 40)}px`,
      zIndex: 5
    };
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!timelineRef.current) return;

    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const template = JSON.parse(data);
      const mainContainer = timelineRef.current.parentElement;
      if (!mainContainer) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const dropY = e.clientY - rect.top;

      const minutesFromTop = Math.round(dropY / pixelsPerMinute);
      const clampedMinutes = Math.max(0, minutesFromTop);

      const startTime = new Date(currentDate);
      startTime.setHours(Math.floor(clampedMinutes / 60), clampedMinutes % 60, 0, 0);

      if (isToday(currentDate) && isPast(startTime)) {
        toast({
          title: 'Past Time Scheduled',
          description: `You've scheduled "${template.title}" for a time that has already passed.`,
          variant: 'default',
        });
      }

      addBlock({ ...template, startTime });
      
      // Hide ghost bubble and clear drag template
      setGhostBubble(null);
      currentDragTemplate.current = null;
      
      // Success animation
      if (timelineRef.current) {
        timelineRef.current.classList.remove('drag-over-active');
        timelineRef.current.classList.add('drop-success');
        setTimeout(() => {
          if (timelineRef.current) {
            timelineRef.current.classList.remove('drop-success');
          }
        }, 600);
      }
    } catch (error) {
      console.error("Failed to parse dropped data", error);
      if (timelineRef.current) {
        timelineRef.current.classList.remove('drag-over-active');
      }
    }
  };

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[class*="absolute left-[80px]"]')) return;
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutesFromTop = Math.round(y / pixelsPerMinute);

    const startTime = new Date(currentDate);
    startTime.setHours(Math.floor(minutesFromTop/60), minutesFromTop % 60, 0, 0);

    setNewBubbleStartTime(startTime);
    setIsBubbleCreateModalOpen(true);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Try to get template data from the drag event
    if (e.dataTransfer.types.includes('application/json')) {
      try {
        const data = e.dataTransfer.getData('application/json');
        if (data) {
          currentDragTemplate.current = JSON.parse(data);
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (timelineRef.current && currentDragTemplate.current) {
      timelineRef.current.classList.add('drag-over-active');
      
      // Update ghost bubble position with better cross-browser compatibility
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      
      // Use clientX/clientY with page offsets for better positioning
      const x = e.clientX + scrollX;
      const y = e.clientY + scrollY;
      
      setGhostBubble(prev => prev ? {
        ...prev,
        position: { x, y }
      } : {
        template: currentDragTemplate.current,
        position: { x, y },
        isVisible: true
      });
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (timelineRef.current && !timelineRef.current.contains(e.relatedTarget as Node)) {
      timelineRef.current.classList.remove('drag-over-active');
      setGhostBubble(null);
      currentDragTemplate.current = null;
    }
  };

  // Track mouse movement for smoother ghost bubble following
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ghostBubble && currentDragTemplate.current) {
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      
      const x = e.clientX + scrollX;
      const y = e.clientY + scrollY;
      
      setGhostBubble(prev => prev ? { ...prev, position: { x, y } } : null);
    }
  };

  return (
    <div
      ref={timelineRef}
      className="relative transition-all duration-200"
      style={{ height: `${TOTAL_HOURS * hourHeight}px` }}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDoubleClick={handleDoubleClick}
      onPointerDown={event => {
        if (!(event.target as Element).closest('[data-bubble-id]')) setSelectedBubbleId(null);
      }}
      onDragLeave={handleDragLeave}
      onMouseMove={handleMouseMove}
      onMouseEnter={showSuggestionsOnHover}
      onMouseLeave={hideSuggestionsWithDelay}
    >
      <TimelineGrid />
      <CurrentTimeIndicator />
      {isLoaded && timeBlocks.map(block => (
        <TimeBubble
          key={block.id}
          block={block}
          timelineRef={timelineRef}
          scrollContainerRef={scrollContainerRef}
          isSelected={selectedBubbleId === block.id}
          onSelect={setSelectedBubbleId}
        />
      ))}
      
      {/* Ghost Bubble for drag preview */}
      {ghostBubble && (
        <GhostBubble
          template={ghostBubble.template}
          position={ghostBubble.position}
          isVisible={ghostBubble.isVisible}
        />
      )}
      
      {/* Suggested Bubbles - only show when hovering or interacting */}
      {showSuggestions && suggestedBubbles.map((suggestion, index) => {
        const isIgnored = ignoredSuggestions.has(suggestion.id);
        return (
          <div
            key={suggestion.id}
            onMouseEnter={keepSuggestionsVisible}
            onMouseLeave={hideSuggestionsWithDelay}
          >
            <SuggestedBubble
              suggestion={suggestion}
              isActive={index === activeSuggestionIndex}
              isIgnored={isIgnored}
              style={getSuggestedBubbleStyle(suggestion)}
              onAccept={() => acceptSuggestion(index)}
              onDismiss={() => dismissSuggestion(index)}
            />
          </div>
        );
      })}
      
      {/* Show ignored suggestions as faded when hovering */}
      {showSuggestions && Array.from(ignoredSuggestions).map(ignoredId => {
        // Find if we have the ignored suggestion data (for display purposes)
        const ignoredSuggestion = suggestedBubbles.find(s => s.id === ignoredId);
        if (!ignoredSuggestion) return null;
        
        return (
          <div
            key={`ignored-${ignoredId}`}
            onMouseEnter={keepSuggestionsVisible}
            onMouseLeave={hideSuggestionsWithDelay}
          >
            <SuggestedBubble
              suggestion={ignoredSuggestion}
              isActive={false}
              isIgnored={true}
              style={getSuggestedBubbleStyle(ignoredSuggestion)}
              onAccept={() => {}}
              onDismiss={() => {}}
            />
          </div>
        );
      })}
      
      {reflectingBlock && <ReflectionModal />}
      {selectedBlock && <BubbleDetailsModal />}
      {reschedulingBlock && <RescheduleModal />}
    </div>
  );
}