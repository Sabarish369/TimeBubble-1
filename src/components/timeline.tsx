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
    } catch (error) {
      console.error("Failed to parse dropped data", error);
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

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (timelineRef.current) {
      timelineRef.current.classList.add('border-blue-500'); // Example: Add a visual indicator
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (timelineRef.current) {
      timelineRef.current.classList.remove('border-blue-500'); // Remove visual indicator
    }
  };

  return (
    <div
      ref={timelineRef}
      className="relative bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-200"
      style={{ height: `${TOTAL_HOURS * hourHeight}px` }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDoubleClick={handleDoubleClick}
      onDragLeave={handleDragLeave}
    >
      <TimelineGrid />
      <CurrentTimeIndicator />
      {isLoaded && timeBlocks.map(block => (
        <TimeBubble key={block.id} block={block} timelineRef={timelineRef} scrollContainerRef={scrollContainerRef} />
      ))}
      {reflectingBlock && <ReflectionModal />}
      {selectedBlock && <BubbleDetailsModal />}
      {reschedulingBlock && <RescheduleModal />}
    </div>
  );
}