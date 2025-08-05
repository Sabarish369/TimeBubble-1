'use client';
import type { DragEvent, MouseEvent } from 'react';
import React, { useEffect } from 'react';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { HOUR_HEIGHT, PIXELS_PER_MINUTE, TOTAL_HOURS, DEFAULT_BUBBLE_COLOR } from '@/lib/constants';
import { CurrentTimeIndicator } from './current-time-indicator';
import { TimelineGrid } from './timeline-grid';
import { TimeBubble } from './time-bubble';
import { ReflectionModal } from './reflection-modal';

export function Timeline() {
  const { timeBlocks, addBlock, isLoaded, updateBlock, reflectingBlock, setReflectingBlock } = useTimeBubbles();
  const timelineRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current && isLoaded) {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const scrollToPosition = minutes * PIXELS_PER_MINUTE - timelineRef.current.clientHeight / 2;
      timelineRef.current.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth',
      });
    }
  }, [isLoaded]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!timelineRef.current) return;

    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const template = JSON.parse(data);
      const rect = timelineRef.current.getBoundingClientRect();
      const dropY = e.clientY - rect.top + timelineRef.current.scrollTop;
      
      const minutesFromTop = Math.round(dropY / PIXELS_PER_MINUTE);
      const startTime = new Date();
      startTime.setHours(Math.floor(minutesFromTop / 60), minutesFromTop % 60, 0, 0);

      addBlock({ ...template, startTime });
    } catch (error) {
      console.error("Failed to parse dropped data", error);
    }
  };

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    // Check if the double click is on a time bubble
    if ((e.target as HTMLElement).closest('[class*="absolute left-[80px]"]')) return;
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + timelineRef.current.scrollTop;
    const minutesFromTop = Math.round(y / PIXELS_PER_MINUTE);

    const startTime = new Date();
    startTime.setHours(Math.floor(minutesFromTop/60), minutesFromTop % 60, 0, 0);
    
    addBlock({
      title: 'New Bubble',
      startTime,
      duration: 60,
      category: 'personal',
      color: DEFAULT_BUBBLE_COLOR
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div
      ref={timelineRef}
      className="relative w-full overflow-y-auto"
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
    </div>
  );
}
