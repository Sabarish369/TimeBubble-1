
'use client';

import type { TimeBlock as TimeBlockType } from '@/types';
import type { MouseEvent, RefObject } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { BUBBLE_COLORS, HOUR_HEIGHT } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, Copy, MoreVertical, Trash2, MessageSquareText, Briefcase, BookOpen, Coffee, User, Heart, type LucideIcon, History, Undo } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { format, isToday, startOfDay } from 'date-fns';
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
} from "@/components/ui/alert-dialog";
import { CelebrationPopper } from './celebration-popper';

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

const ActiveBubbleAnimation = () => {
    return (
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div className="active-bubble"></div>
            <div className="active-bubble"></div>
            <div className="active-bubble"></div>
            <div className="active-bubble"></div>
            <div className="active-bubble"></div>
        </div>
    );
};

export function TimeBubble({ block, timelineRef }: TimeBubbleProps) {
  const { updateBlock, deleteBlock, duplicateBlock, setReflectingBlock, setSelectedBlock, setReschedulingBlock, zoomLevel, currentDate } = useTimeBubbles();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [didMove, setDidMove] = useState(false);
  
  const [liveStartTime, setLiveStartTime] = useState(block.startTime);
  const [liveDuration, setLiveDuration] = useState(block.duration);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCurrent, setIsCurrent] = useState(false);
  const [isPast, setIsPast] = useState(false);


  const pixelsPerMinute = (HOUR_HEIGHT * zoomLevel) / 60;

  // Keep live state in sync with block prop, but only if not actively being manipulated
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setLiveStartTime(block.startTime);
      setLiveDuration(block.duration);
    }
  }, [block.startTime, block.duration, isDragging, isResizing]);

  // Trigger celebration when block becomes completed
  useEffect(() => {
    if (block.completed) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [block.completed]);
  
  // Check if bubble is the current one or overdue
  useEffect(() => {
    const checkState = () => {
      const now = new Date();
      const startTime = block.startTime;
      const endTime = new Date(startTime.getTime() + block.duration * 60000);

      const isForToday = isToday(currentDate);

      setIsCurrent(isForToday && now >= startTime && now < endTime);
      // A block is in the past if its end time is before now, OR if its date is before today.
      setIsPast(now >= endTime || startOfDay(currentDate) < startOfDay(new Date()));
    };

    checkState();
    const interval = setInterval(checkState, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [block.startTime, block.duration, currentDate]);


  const dragStartRef = useRef({ y: 0, initialTop: 0, initialHeight: 0 });

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // Only allow dragging, not opening the modal
    if (e.target !== e.currentTarget) {
        const targetElement = e.target as HTMLElement;
        if (targetElement.closest('button')) {
            return;
        }
    }
    
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDidMove(false);
    dragStartRef.current = { y: e.clientY, initialTop: top, initialHeight: 0 };
  };

  const handleResizeMouseDown = (e: MouseEvent<HTMLDivElement>, direction: 'top' | 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    setDidMove(false);
    dragStartRef.current = { y: e.clientY, initialTop: top, initialHeight: height };
  };
  
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) {
        const targetElement = e.target as HTMLElement;
        if (targetElement.closest('button')) {
            return;
        }
    }
    if (didMove) {
        return;
    }
    e.stopPropagation();
    setSelectedBlock(block);
  };

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      updateBlock(block.id, { startTime: liveStartTime });
    }
    if (isResizing) {
      updateBlock(block.id, { startTime: liveStartTime, duration: liveDuration });
    }
    setIsDragging(false);
    setIsResizing(null);
  }, [isResizing, isDragging, block.id, liveStartTime, liveDuration, updateBlock]);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const deltaY = e.clientY - dragStartRef.current.y;
    if (Math.abs(deltaY) > 2) { // Threshold to detect actual movement
      setDidMove(true);
    }
    
    e.preventDefault();

    const timeline = timelineRef.current;
    if (!timeline) return;
    
    const timelineRect = timeline.getBoundingClientRect();

    if (isDragging) {
      const newTop = dragStartRef.current.initialTop + deltaY;
      const newMinutesRaw = newTop / pixelsPerMinute;
      const newMinutes = Math.max(0, newMinutesRaw);
      const newStartTime = new Date(block.startTime);
      newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
      setLiveStartTime(newStartTime);
    }

    if (isResizing) {
      if (isResizing === 'bottom') {
        const newHeight = dragStartRef.current.initialHeight + deltaY;
        const newDuration = Math.max(15, newHeight / pixelsPerMinute);
        setLiveDuration(newDuration);
      }
      if (isResizing === 'top') {
        const newTop = dragStartRef.current.initialTop + deltaY;
        const newHeight = dragStartRef.current.initialHeight - deltaY;
        
        if (newHeight >= 15 * pixelsPerMinute) {
          const newMinutesRaw = newTop / pixelsPerMinute;
          const newMinutes = Math.max(0, newMinutesRaw);
          const newStartTime = new Date(block.startTime);
          newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);

          const originalEndTime = new Date(block.startTime);
          originalEndTime.setMinutes(originalEndTime.getMinutes() + block.duration);

          const durationDifference = (originalEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);
          const newDuration = Math.max(15, durationDifference);
          
          setLiveStartTime(newStartTime);
          setLiveDuration(newDuration);
        }
      }
    }
  }, [isDragging, isResizing, block.startTime, block.duration, timelineRef, pixelsPerMinute]);


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

  const startTimeToDisplay = isResizing || isDragging ? liveStartTime : block.startTime;
  const durationToDisplay = isResizing || isDragging ? liveDuration : block.duration;
  
  const minutesFromMidnight = startTimeToDisplay.getHours() * 60 + startTimeToDisplay.getMinutes();
  const top = Math.max(0, minutesFromMidnight * pixelsPerMinute);
  const height = durationToDisplay * pixelsPerMinute;

  const showFullContent = height >= 60;
  const showCompactContent = height >= 40 && height < 60;

  const endTimeToDisplay = new Date(startTimeToDisplay.getTime() + durationToDisplay * 60000);

  const Icon = categoryIcons[block.category];
  
  const isOverdue = isPast && !block.completed;
  const isInteractive = !isDragging && !isResizing;
  const showAsCurrent = isCurrent && !block.completed;

  const bubbleStyle: React.CSSProperties = {
    top: `${top}px`,
    height: `${height}px`,
    transition: 'top 0.2s ease-out, height 0.2s ease-out, box-shadow 0.3s ease-in-out, background 0.3s ease-in-out, opacity 0.3s ease-in-out',
    '--glow-color': `var(--bubble-${block.color})`,
  };

  const handleUndoComplete = () => {
    updateBlock(block.id, { completed: false, reflection: undefined, notified: false });
    setShowCelebration(false);
  };
  
  return (
    <div
      className={cn(
        'absolute left-[80px] right-4 rounded-lg p-3 flex flex-col items-start shadow-md transition-all duration-200 z-10',
        'select-none', 
        'outline outline-1 outline-slate-300/50 dark:outline-slate-700/50',
        isDragging && 'shadow-lg scale-105 z-20 cursor-grabbing',
        showAsCurrent && 'is-glowing',
        isInteractive && !isDragging && 'cursor-pointer'
      )}
      style={bubbleStyle}
      onMouseDown={isInteractive ? handleMouseDown : undefined}
      onClick={isInteractive ? handleClick : undefined}
    >
       <div 
        className={cn("absolute inset-0 rounded-lg")}
        style={{
          background: block.completed 
            ? 'linear-gradient(to bottom, hsl(140, 60%, 65%), hsl(140, 60%, 45%))' 
            : `linear-gradient(to bottom, hsl(var(--bubble-${block.color})), hsl(var(--bubble-${block.color}) / 0.8))`
        }}
      />

       {showCelebration && <CelebrationPopper />}
       {showAsCurrent && <ActiveBubbleAnimation />}
      
      <div className="absolute top-1 right-1 z-20 flex items-center" style={{ opacity: isOverdue ? 0 : 1}}>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 cursor-pointer" onClick={(e) => {e.stopPropagation(); setReflectingBlock(block)}}>
            <MessageSquareText className="w-4 h-4 text-slate-700 dark:text-white" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 cursor-pointer" onClick={e => e.stopPropagation()}>
              <Trash2 className="w-4 h-4 text-slate-700 dark:text-white" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={e => e.stopPropagation()}>
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
             {block.completed && (
              <DropdownMenuItem onSelect={handleUndoComplete}>
                <Undo className="mr-2 h-4 w-4" />
                <span>Undo Complete</span>
              </DropdownMenuItem>
            )}
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

      <div className={cn("w-full h-full pointer-events-none relative z-10 flex-1")}>
         <div 
          className={cn("absolute inset-0 rounded-lg", !isOverdue && "hidden")}
          style={{
            background: 'rgba(0,0,0,0.5)'
          }}
        />
        {showFullContent ? (
          <div className={cn("flex-grow overflow-hidden flex items-center gap-3 h-full")}>
            <Icon className="h-6 w-6 text-slate-700 dark:text-white shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="text-base font-semibold text-slate-800 dark:text-white pointer-events-none truncate">{block.title}</p>
              <p className="text-sm text-slate-700 dark:text-white/80 pointer-events-none">
                {format(startTimeToDisplay, 'p')} - {format(endTimeToDisplay, 'p')}
              </p>
            </div>
          </div>
        ) : showCompactContent ? (
           <div className={cn("flex-grow overflow-hidden flex items-center gap-3 h-full")}>
            <Icon className="h-5 w-5 text-slate-700 dark:text-white shrink-0" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white pointer-events-none truncate">{block.title}</p>
          </div>
        ) : (
          <div className='w-full h-full flex items-center justify-center pointer-events-none'>
            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate px-4">{block.title}</p>
          </div>
        )}
      </div>

      {block.completed && (
        <div className="absolute inset-0 rounded-lg flex items-center justify-center pointer-events-none z-10">
            <Check className="h-8 w-8 text-white" />
        </div>
      )}

      {isOverdue && (
        <div className="absolute inset-0 z-20 flex items-center justify-center gap-2">
          <Button variant="reflect" onClick={() => setReflectingBlock(block)}>
            <MessageSquareText className="mr-2 h-4 w-4"/>
            Reflect
          </Button>
          <Button variant="secondary" onClick={() => setReschedulingBlock(block)}>
            <History className="mr-2 h-4 w-4" />
            Reschedule
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" onClick={e => e.stopPropagation()}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={e => e.stopPropagation()}>
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
        </div>
      )}

      <div
        className="absolute -top-px left-0 w-full h-1.5 cursor-n-resize z-20"
        onMouseDown={isInteractive ? (e) => handleResizeMouseDown(e, 'top') : undefined}
      />
      <div
        className="absolute -bottom-px left-0 w-full h-1.5 cursor-s-resize z-20"
        onMouseDown={isInteractive ? (e) => handleResizeMouseDown(e, 'bottom') : undefined}
      />
    </div>
  );
}

    
    