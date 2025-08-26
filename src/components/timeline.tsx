
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
import { isToday, isPast } from 'date-fns';

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
  const { toast } = useToast();
  
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
      
      // Update ghost bubble position
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
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

  return (
    <div
      ref={timelineRef}
      className="relative transition-all duration-200"
      style={{ height: `${TOTAL_HOURS * hourHeight}px` }}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDoubleClick={handleDoubleClick}
      onDragLeave={handleDragLeave}
      onMouseMove={ghostBubble ? (e) => {
        if (currentDragTemplate.current) {
          const rect = timelineRef.current?.getBoundingClientRect();
          if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setGhostBubble(prev => prev ? { ...prev, position: { x, y } } : null);
          }
        }
      } : undefined}
    >
      <TimelineGrid />
      <CurrentTimeIndicator />
      {isLoaded && timeBlocks.map(block => (
        <TimeBubble key={block.id} block={block} timelineRef={timelineRef} scrollContainerRef={scrollContainerRef} />
      ))}
      
      {/* Ghost Bubble for drag preview */}
      {ghostBubble && (
        <GhostBubble
          template={ghostBubble.template}
          position={ghostBubble.position}
          isVisible={ghostBubble.isVisible}
        />
      )}
      
      {reflectingBlock && <ReflectionModal />}
      {selectedBlock && <BubbleDetailsModal />}
      {reschedulingBlock && <RescheduleModal />}
    </div>
  );
}
