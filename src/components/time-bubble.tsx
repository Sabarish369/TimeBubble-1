'use client';

import type { TimeBlock as TimeBlockType } from '@/types';
import type { MouseEvent, RefObject } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { BUBBLE_COLORS, PIXELS_PER_MINUTE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, Copy, MoreVertical, Trash2, MessageSquareText } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Input } from './ui/input';

interface TimeBubbleProps {
  block: TimeBlockType;
  timelineRef: RefObject<HTMLDivElement>;
}

export function TimeBubble({ block, timelineRef }: TimeBubbleProps) {
  const { updateBlock, deleteBlock, duplicateBlock, setReflectingBlock } = useTimeBubbles();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(block.title);
  const dragStartRef = useRef({ y: 0, initialTop: 0, initialHeight: 0 });

  const minutesFromMidnight = block.startTime.getHours() * 60 + block.startTime.getMinutes();
  const top = minutesFromMidnight * PIXELS_PER_MINUTE;
  const height = block.duration * PIXELS_PER_MINUTE;

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if(isEditing) return;
    setIsDragging(true);
    dragStartRef.current = { y: e.clientY, initialTop: top, initialHeight: 0 };
  };

  const handleResizeMouseDown = (e: MouseEvent<HTMLDivElement>, direction: 'top' | 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    dragStartRef.current = { y: e.clientY, initialTop: top, initialHeight: height };
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    e.preventDefault();

    const timeline = timelineRef.current;
    if (!timeline) return;
    
    const timelineRect = timeline.getBoundingClientRect();
    const relativeY = e.clientY - timelineRect.top;

    const deltaY = e.clientY - dragStartRef.current.y;

    if (isDragging) {
      const newTop = dragStartRef.current.initialTop + deltaY;
      const newMinutes = Math.round(newTop / PIXELS_PER_MINUTE / 15) * 15;
      const newStartTime = new Date(block.startTime);
      newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
      updateBlock(block.id, { startTime: newStartTime });
    }

    if (isResizing) {
      if (isResizing === 'bottom') {
        const newHeight = dragStartRef.current.initialHeight + deltaY;
        const newDuration = Math.max(15, Math.round(newHeight / PIXELS_PER_MINUTE / 15) * 15);
        updateBlock(block.id, { duration: newDuration });
      }
      if (isResizing === 'top') {
        const newTop = dragStartRef.current.initialTop + deltaY;
        const newHeight = dragStartRef.current.initialHeight - deltaY;
        
        if (newHeight >= 15 * PIXELS_PER_MINUTE) {
          const newMinutes = Math.round(newTop / PIXELS_PER_MINUTE / 15) * 15;
          const newStartTime = new Date(block.startTime);
          newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);

          const originalEndTime = new Date(block.startTime);
          originalEndTime.setMinutes(originalEndTime.getMinutes() + block.duration);

          const durationDifference = (originalEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);
          const newDuration = Math.max(15, Math.round(durationDifference / 15) * 15);

          updateBlock(block.id, { startTime: newStartTime, duration: newDuration });
        }
      }
    }
  }, [isDragging, isResizing, block.id, block.startTime, block.duration, updateBlock, timelineRef]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  const handleTitleBlur = () => {
    setIsEditing(false);
    updateBlock(block.id, { title });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      handleTitleBlur();
    }
  };

  const isPast = new Date() > new Date(block.startTime.getTime() + block.duration * 60000);
  const showContent = height >= 35;
  const canReflect = isPast && !block.completed;
  
  return (
    <div
      className={cn(
        'absolute left-16 right-4 rounded-lg p-2 flex flex-col shadow-md transition-all duration-200 z-10',
        'select-none', // Prevent text selection while dragging
        isDragging && 'shadow-xl scale-105 z-20 cursor-grabbing',
        isResizing && 'z-20',
        isPast && !block.completed && 'opacity-60',
        block.completed && 'opacity-70 border-2 border-green-500'
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: block.color,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          "absolute top-1 right-1 z-20"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 cursor-pointer">
              <MoreVertical className="w-4 h-4 text-black/70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onClick={e => e.stopPropagation()}>
            {canReflect && (
              <>
                <DropdownMenuItem onSelect={() => setReflectingBlock(block)}>
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  <span>Reflect</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={() => duplicateBlock(block.id)}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicate</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => deleteBlock(block.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="flex gap-2 p-2">
              {Object.entries(BUBBLE_COLORS).map(([name, color]) => (
                <button
                  key={name}
                  className={cn("w-6 h-6 rounded-full border", block.color === color && "ring-2 ring-ring")}
                  style={{ backgroundColor: color }}
                  onClick={() => updateBlock(block.id, { color })}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={cn("flex-grow overflow-hidden cursor-grab flex items-center", !showContent && "justify-center")} onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
        {isEditing ? (
          <Input
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="h-full w-full bg-transparent border-0 focus-visible:ring-0 p-0 text-sm font-medium text-black/90"
            autoFocus
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm font-medium text-black/90 pointer-events-none">{block.title}</p>
        )}
      </div>

      {canReflect && showContent && (
        <Button size="sm" className="mt-auto h-7 z-10" onClick={(e) => { e.stopPropagation(); setReflectingBlock(block); }}>
          Reflect
        </Button>
      )}

      {block.completed && (
        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center pointer-events-none">
            <Check className="h-8 w-8 text-white" />
        </div>
      )}

      <div
        className="absolute top-0 left-0 w-full h-1.5 cursor-n-resize z-10"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-1.5 cursor-s-resize z-10"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
      />
    </div>
  );
}
