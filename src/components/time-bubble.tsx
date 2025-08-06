
'use client';

import type { TimeBlock as TimeBlockType } from '@/types';
import type { MouseEvent, RefObject } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { BUBBLE_COLORS, PIXELS_PER_MINUTE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, Copy, MoreVertical, Trash2, MessageSquareText, Briefcase, BookOpen, Coffee, User, Heart, type LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Input } from './ui/input';
import { format } from 'date-fns';
import type { BubbleCategory } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface TimeBubbleProps {
  block: TimeBlockType;
  timelineRef: RefObject<HTMLDivElement>;
}

const categoryIcons: Record<BubbleCategory, LucideIcon> = {
  work: Briefcase,
  study: BookOpen,
  break: Coffee,
  personal: User,
  health: Heart,
};

export function TimeBubble({ block, timelineRef }: TimeBubbleProps) {
  const { updateBlock, deleteBlock, duplicateBlock, setReflectingBlock } = useTimeBubbles();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(block.title);
  
  const [liveStartTime, setLiveStartTime] = useState(block.startTime);
  const [liveDuration, setLiveDuration] = useState(block.duration);

  useEffect(() => {
    setLiveStartTime(block.startTime);
    setLiveDuration(block.duration);
  }, [block.startTime, block.duration]);


  const dragStartRef = useRef({ y: 0, initialTop: 0, initialHeight: 0 });

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
    if (isDragging) {
      const newMinutes = (liveStartTime.getHours() * 60) + liveStartTime.getMinutes();
      const newDate = new Date();
      newDate.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
      updateBlock(block.id, { startTime: newDate });
    }
    if (isResizing) {
      updateBlock(block.id, { startTime: liveStartTime, duration: liveDuration });
    }
    setIsDragging(false);
    setIsResizing(null);
  }, [isResizing, isDragging, block.id, liveStartTime, liveDuration, updateBlock]);

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
      const newMinutesRaw = newTop / PIXELS_PER_MINUTE;
      const newMinutes = Math.round(Math.max(0, newMinutesRaw) / 15) * 15;
      const newStartTime = new Date(block.startTime);
      newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
      setLiveStartTime(newStartTime);
    }

    if (isResizing) {
      if (isResizing === 'bottom') {
        const newHeight = dragStartRef.current.initialHeight + deltaY;
        const newDuration = Math.max(15, Math.round(newHeight / PIXELS_PER_MINUTE / 15) * 15);
        setLiveDuration(newDuration);
      }
      if (isResizing === 'top') {
        const newTop = dragStartRef.current.initialTop + deltaY;
        const newHeight = dragStartRef.current.initialHeight - deltaY;
        
        if (newHeight >= 15 * PIXELS_PER_MINUTE) {
          const newMinutesRaw = newTop / PIXELS_PER_MINUTE;
          const newMinutes = Math.round(Math.max(0, newMinutesRaw) / 15) * 15;
          const newStartTime = new Date(block.startTime);
          newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);

          const originalEndTime = new Date(block.startTime);
          originalEndTime.setMinutes(originalEndTime.getMinutes() + block.duration);

          const durationDifference = (originalEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);
          const newDuration = Math.max(15, Math.round(durationDifference / 15) * 15);
          
          setLiveStartTime(newStartTime);
          setLiveDuration(newDuration);
        }
      }
    }
  }, [isDragging, isResizing, block.startTime, block.duration, timelineRef]);


  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

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

  const startTimeToDisplay = isResizing || isDragging ? liveStartTime : block.startTime;
  const durationToDisplay = isResizing ? liveDuration : block.duration;
  
  const minutesFromMidnight = startTimeToDisplay.getHours() * 60 + startTimeToDisplay.getMinutes();
  const top = Math.max(0, minutesFromMidnight * PIXELS_PER_MINUTE);
  const height = durationToDisplay * PIXELS_PER_MINUTE;

  const showFullContent = height >= 60;
  const showCompactContent = height >= 40 && height < 60;

  const endTimeToDisplay = new Date(startTimeToDisplay.getTime() + durationToDisplay * 60000);

  const Icon = categoryIcons[block.category];
  
  return (
    <div
      className={cn(
        'absolute left-[80px] right-4 rounded-lg p-3 flex items-start shadow-md transition-all duration-200 z-10 border',
        'select-none', 
        'border-slate-300/50 dark:border-slate-700/50',
        isDragging && 'shadow-lg scale-105 z-20 cursor-grabbing',
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: `hsl(var(--bubble-${block.color}))`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          "absolute top-1 right-1 z-20 flex items-center"
        )}
      >
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 cursor-pointer" onClick={(e) => {e.stopPropagation(); setReflectingBlock(block)}}>
            <MessageSquareText className="w-4 h-4 text-slate-700 dark:text-white" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 cursor-pointer">
              <MoreVertical className="w-4 h-4 text-slate-700 dark:text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onClick={e => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => duplicateBlock(block.id)}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicate</span>
            </DropdownMenuItem>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the "{block.title}" bubble. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteBlock(block.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <DropdownMenuSeparator />
            <div className="flex gap-2 p-2">
              {Object.keys(BUBBLE_COLORS).map((colorName) => (
                <button
                  key={colorName}
                  className={cn("w-6 h-6 rounded-full border", block.color === colorName && "ring-2 ring-ring")}
                  style={{ backgroundColor: `hsl(var(--bubble-${colorName}))` }}
                  onClick={() => updateBlock(block.id, { color: colorName as keyof typeof BUBBLE_COLORS })}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full h-full" onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
        {showFullContent ? (
          <div className={cn("flex-grow overflow-hidden cursor-grab flex items-center gap-3 h-full")}>
            <Icon className="h-6 w-6 text-slate-700 dark:text-white shrink-0" />
            <div className="flex-1 overflow-hidden">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className="h-auto w-full bg-transparent border-0 focus-visible:ring-0 p-0 text-base font-semibold text-slate-800 dark:text-white"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                />
              ) : (
                <p className="text-base font-semibold text-slate-800 dark:text-white pointer-events-none truncate">{block.title}</p>
              )}
              <p className="text-sm text-slate-700 dark:text-white/80 pointer-events-none">
                {format(startTimeToDisplay, 'p')} - {format(endTimeToDisplay, 'p')}
              </p>
            </div>
          </div>
        ) : showCompactContent ? (
           <div className={cn("flex-grow overflow-hidden cursor-grab flex items-center gap-3 h-full")}>
            <Icon className="h-5 w-5 text-slate-700 dark:text-white shrink-0" />
             {isEditing ? (
                <Input
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className="h-auto w-full bg-transparent border-0 focus-visible:ring-0 p-0 text-sm font-semibold text-slate-800 dark:text-white"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm font-semibold text-slate-800 dark:text-white pointer-events-none truncate">{block.title}</p>
              )}
          </div>
        ) : (
          <div className='w-full h-full flex items-center justify-center pointer-events-none'>
            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate px-4">{block.title}</p>
          </div>
        )}
      </div>

      {block.completed && (
        <div className="absolute inset-0 bg-slate-900/60 rounded-lg flex items-center justify-center pointer-events-none">
            <Check className="h-8 w-8 text-green-400" />
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
