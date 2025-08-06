
'use client';
import type { DragEvent, MouseEvent } from 'react';
import React from 'react';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { HOUR_HEIGHT, PIXELS_PER_MINUTE, TOTAL_HOURS, DEFAULT_BUBBLE_COLOR } from '@/lib/constants';
import { CurrentTimeIndicator } from './current-time-indicator';
import { TimelineGrid } from './timeline-grid';
import { TimeBubble } from './time-bubble';
import { ReflectionModal } from './reflection-modal';
import { BubbleDetailsModal } from './bubble-details-modal';

export function Timeline() {
  const { timeBlocks, addBlock, isLoaded, reflectingBlock, selectedBlock } = useTimeBubbles();
  const timelineRef = React.useRef<HTMLDivElement>(null);

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
      
      const minutesFromTop = Math.round(dropY / PIXELS_PER_MINUTE);
      const clampedMinutes = Math.max(0, minutesFromTop);
      
      const startTime = new Date();
      startTime.setHours(Math.floor(clampedMinutes / 60), clampedMinutes % 60, 0, 0);

      addBlock({ ...template, startTime });
    } catch (error) {
      console.error("Failed to parse dropped data", error);
    }
  };

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[class*="absolute left-[80px]"]')) return;
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    // Adjust for the main container's scroll position
    const y = e.clientY - rect.top + (timelineRef.current.parentElement?.scrollTop ?? 0);
    const minutesFromTop = Math.round(y / PIXELS_PER_MINUTE);

    const startTime = new Date();
    startTime.setHours(Math.floor(minutesFromTop/60), minutesFromTop % 60, 0, 0);
    
    addBlock({
      title: 'New Bubble',
      startTime,
      duration: 60,
      category: 'personal',
      color: DEFAULT_BUBBLE_COLOR,
      description: '',
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div
      ref={timelineRef}
      className="relative w-full"
      style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDoubleClick={handleDoubleClick}
    >
      <TimelineGrid />
      <CurrentTimeIndicator />
      {isLoaded && timeBlocks.map(block => (
        <TimeBubble key={block.id} block={block} timelineRef={timelineRef} />
      ))}
      {reflectingBlock && <ReflectionModal />}
      {selectedBlock && <BubbleDetailsModal />}
    </div>
  );
}
