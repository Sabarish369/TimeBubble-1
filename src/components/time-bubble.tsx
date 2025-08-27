
'use client';

import type { TimeBlock as TimeBlockType } from '@/types';
import type { MouseEvent, RefObject } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { BUBBLE_COLORS, HOUR_HEIGHT, TOTAL_HOURS, FREE_COLOR_NAMES, PRO_COLOR_NAMES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, Copy, MoreVertical, Trash2, MessageSquareText, Briefcase, BookOpen, Coffee, User, Heart, type LucideIcon, History, Undo, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from './ui/dropdown-menu';
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
import { ActiveBubbleAnimation } from './active-bubble-animation';
import { ensureDateObject } from '@/lib/time-bubbles-utils';
import { TaskCompletionCelebration } from './task-completion-celebration';
import { useAuth } from '@/context/auth-context';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { ProModal } from './pro-modal';

interface TimeBubbleProps {
  block: TimeBlockType;
  timelineRef: RefObject<HTMLDivElement>;
  scrollContainerRef: RefObject<HTMLElement>;
}

const categoryIcons: Record<BubbleCategory, LucideIcon> = {
  work: Briefcase,
  study: BookOpen,
  break: Coffee,
  personal: User,
  health: Heart,
};

function TimeBubbleComponent({ block, timelineRef, scrollContainerRef }: TimeBubbleProps) {
  const { updateBlock, deleteBlock, duplicateBlock, setReflectingBlock, setSelectedBlock, setReschedulingBlock, zoomLevel, currentDate } = useTimeBubbles();
  const { isPro } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [didMove, setDidMove] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  
  const [liveStartTime, setLiveStartTime] = useState(ensureDateObject(block.startTime));
  const [liveDuration, setLiveDuration] = useState(block.duration);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPosition, setCelebrationPosition] = useState({ x: 0, y: 0 });
  const [isCurrent, setIsCurrent] = useState(false);
  const [isPast, setIsPast] = useState(false);


  const pixelsPerMinute = (HOUR_HEIGHT * zoomLevel) / 60;
  const scrollIntervalRef = useRef<number | null>(null);


  // Keep live state in sync with block prop, but only if not actively being manipulated
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setLiveStartTime(ensureDateObject(block.startTime));
      setLiveDuration(block.duration);
    }
  }, [block.startTime, block.duration, isDragging, isResizing]);

  // Trigger celebration when block becomes completed
  useEffect(() => {
    if (block.completed) {
      // Get the bubble's position for celebration
      const bubbleElement = document.querySelector(`[data-bubble-id="${block.id}"]`);
      if (bubbleElement) {
        const rect = bubbleElement.getBoundingClientRect();
        setCelebrationPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000); // Extended animation duration
      return () => clearTimeout(timer);
    }
  }, [block.completed, block.id]);
  
  // Check if bubble is the current one or overdue
  useEffect(() => {
    const checkState = () => {
      const now = new Date();
      const startTime = ensureDateObject(block.startTime);
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

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    setIsDragging(true);
    setDidMove(false);
    const top = (ensureDateObject(block.startTime).getHours() * 60 + ensureDateObject(block.startTime).getMinutes()) * pixelsPerMinute;
    dragStartRef.current = { y: e.clientY, initialTop: top, initialHeight: 0 };
  };

  const handleResizeMouseDown = (e: MouseEvent<HTMLDivElement>, direction: 'top' | 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    setDidMove(false);
    const top = (ensureDateObject(block.startTime).getHours() * 60 + ensureDateObject(block.startTime).getMinutes()) * pixelsPerMinute;
    const height = block.duration * pixelsPerMinute;
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

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      updateBlock(block.id, { startTime: liveStartTime, duration: liveDuration }, true);
      
      // Add a subtle "snap" animation
      setTimeout(() => {
        const element = document.querySelector(`[data-bubble-id="${block.id}"]`) as HTMLElement;
        if (element) {
          element.style.animation = 'snapInPlace 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
          setTimeout(() => {
            element.style.animation = '';
          }, 300);
        }
      }, 50);
    }
    setIsDragging(false);
    setIsResizing(null);
    setDragOffset({ x: 0, y: 0 });
    stopAutoScroll();
  }, [isResizing, isDragging, block.id, liveStartTime, liveDuration, updateBlock, stopAutoScroll]);


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
    const timelineEndMinutes = TOTAL_HOURS * 60;

    if (isDragging) {
      const maxMinutes = timelineEndMinutes - liveDuration;
      const newTop = dragStartRef.current.initialTop + deltaY;
      const newMinutesRaw = newTop / pixelsPerMinute;
      const newMinutes = Math.max(0, Math.min(newMinutesRaw, maxMinutes));
      const newStartTime = new Date(liveStartTime);
      newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
      
      setLiveStartTime(newStartTime);
    }

    if (isResizing) {
      if (isResizing === 'bottom') {
        const newHeight = dragStartRef.current.initialHeight + deltaY;
        const currentStartMinutes = liveStartTime.getHours() * 60 + liveStartTime.getMinutes();
        const maxDuration = timelineEndMinutes - currentStartMinutes;
        const newDuration = Math.min(maxDuration, Math.max(15, newHeight / pixelsPerMinute));
        setLiveDuration(newDuration);
      }
      if (isResizing === 'top') {
        const newHeight = dragStartRef.current.initialHeight - deltaY;
        
        if (newHeight >= 15 * pixelsPerMinute) {
          const newTop = dragStartRef.current.initialTop + deltaY;
          const newMinutesRaw = newTop / pixelsPerMinute;
          const newMinutes = Math.max(0, newMinutesRaw);
          const newStartTime = new Date(liveStartTime);
          newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);

          const endOfOriginalBlock = new Date(ensureDateObject(block.startTime).getTime() + block.duration * 60000);
          
          const durationDifference = (endOfOriginalBlock.getTime() - newStartTime.getTime()) / (1000 * 60);
          const newDuration = Math.max(15, durationDifference);
          
          setLiveStartTime(newStartTime);
          setLiveDuration(newDuration);
        }
      }
    }

    // Auto-scroll logic
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
        const { top: containerTop, bottom: containerBottom, height: containerHeight } = scrollContainer.getBoundingClientRect();
        const threshold = 60; // pixels from the edge to trigger scroll
        stopAutoScroll();

        if (e.clientY < containerTop + threshold) {
            scrollIntervalRef.current = window.setInterval(() => {
                const scrollSpeed = (threshold - (e.clientY - containerTop)) / 5;
                scrollContainer.scrollTop -= scrollSpeed;
            }, 15);
        } else if (e.clientY > containerBottom - threshold) {
            scrollIntervalRef.current = window.setInterval(() => {
                const scrollSpeed = (threshold - (containerBottom - e.clientY)) / 5;
                scrollContainer.scrollTop += scrollSpeed;
            }, 15);
        }
    }


  }, [isDragging, isResizing, pixelsPerMinute, scrollContainerRef, stopAutoScroll, liveStartTime, block, liveDuration, timelineRef]);


  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      stopAutoScroll();
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, stopAutoScroll]);
  
  const startTimeToDisplay = isDragging || isResizing ? liveStartTime : ensureDateObject(block.startTime);
  const durationToDisplay = isDragging || isResizing ? liveDuration : block.duration;
  
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
    transform: isDragging ? `scale(1.02) rotate(${Math.sin(Date.now() * 0.001) * 0.5}deg)` : isHovering ? 'scale(1.01)' : 'scale(1)',
    transition: isDragging || isResizing ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    ['--glow-color' as any]: `var(--bubble-${block.color})`,
    zIndex: isDragging ? 40 : isHovering ? 20 : 'auto',
    filter: isDragging ? 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))' : 'none',
    overflow: 'hidden'
  };
  
  const handleUndoComplete = () => {
    updateBlock(block.id, { completed: false, reflection: undefined, notified: false });
    setShowCelebration(false);
  };
  
  const handleColorSelect = (colorName: keyof typeof BUBBLE_COLORS) => {
    if (PRO_COLOR_NAMES.includes(colorName as any) && !isPro) {
        setIsProModalOpen(true);
    } else {
        updateBlock(block.id, { color: colorName });
    }
  };

  return (
    <>
    <div
      data-bubble-id={block.id}
      className={cn(
        'absolute left-[50px] md:left-[80px] right-2 md:right-4 rounded-lg p-2 md:p-3 flex flex-col items-start shadow-md time-bubble',
        'select-none', 
        'outline outline-1 outline-slate-300/50 dark:outline-slate-700/50',
        isDragging && 'shadow-2xl cursor-grabbing drag-active time-bubble-dragging',
        isResizing && 'shadow-xl resize-active',
        isHovering && !isDragging && !isResizing && 'shadow-lg hover-active',
        showAsCurrent && 'is-glowing',
        isInteractive && !isDragging && 'cursor-pointer hover:shadow-lg'
      )}
      style={bubbleStyle}
      onMouseDown={isInteractive ? handleMouseDown : undefined}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
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
      
      {showAsCurrent && <ActiveBubbleAnimation />}
      {showCelebration && (
        <TaskCompletionCelebration
          isVisible={showCelebration}
          position={celebrationPosition}
          onComplete={() => setShowCelebration(false)}
        />
      )}
      
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
            <DropdownMenuGroup>
                <div className="text-xs text-muted-foreground px-2 pt-1 pb-2">Free Colors</div>
                <div className="flex gap-2 p-2">
                {FREE_COLOR_NAMES.map((colorName) => (
                    <button
                    key={colorName}
                    className={cn("w-6 h-6 rounded-full border", block.color === colorName && "ring-2 ring-ring")}
                    style={{ backgroundColor: `hsl(var(--bubble-${colorName}))` }}
                    onClick={() => updateBlock(block.id, { color: colorName as keyof typeof BUBBLE_COLORS })}
                    />
                ))}
                </div>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
                <div className="text-xs text-muted-foreground px-2 pt-1 pb-2">Pro Colors</div>
                <div className="flex gap-2 p-2">
                <TooltipProvider>
                    {PRO_COLOR_NAMES.map((colorName) => (
                        <Tooltip key={colorName} delayDuration={100}>
                        <TooltipTrigger asChild>
                            <button
                                key={colorName}
                                className={cn("w-6 h-6 rounded-full border relative", 
                                    block.color === colorName && "ring-2 ring-ring",
                                    !isPro && "opacity-60"
                                )}
                                style={{ backgroundColor: `hsl(var(--bubble-${colorName}))` }}
                                onClick={() => handleColorSelect(colorName)}
                            >
                            {!isPro && <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white opacity-90"/>}
                            </button>
                        </TooltipTrigger>
                        {!isPro && (
                            <TooltipContent>
                                <p>Upgrade to Pro to use this color.</p>
                            </TooltipContent>
                        )}
                        </Tooltip>
                    ))}
                </TooltipProvider>
                </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={cn("w-full h-full pointer-events-none relative z-10 flex-1")}>
        {showFullContent ? (
          <div className={cn("flex-grow overflow-hidden flex items-center gap-2 md:gap-3 h-full")}>
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-slate-700 dark:text-white shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm md:text-base font-semibold text-slate-800 dark:text-white pointer-events-none truncate">{block.title}</p>
              <p className="text-xs md:text-sm text-slate-700 dark:text-white/80 pointer-events-none">
                {format(startTimeToDisplay, 'p')} - {format(endTimeToDisplay, 'p')}
              </p>
            </div>
          </div>
        ) : showCompactContent ? (
           <div className={cn("flex-grow overflow-hidden flex items-center gap-2 md:gap-3 h-full")}>
            <Icon className="h-5 w-5 text-slate-700 dark:text-white shrink-0" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white pointer-events-none truncate">{block.title}</p>
          </div>
        ) : (
          <div className='w-full h-full flex items-center justify-center pointer-events-none'>
            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate px-2">{block.title}</p>
          </div>
        )}
      </div>

      {block.completed && (
        <div className="absolute inset-0 rounded-lg flex items-center justify-center pointer-events-none z-10">
            <Check className="h-8 w-8 text-white" />
        </div>
      )}

      {isOverdue && (
        <div className="absolute inset-0 z-20 rounded-lg flex flex-col items-center justify-center gap-2 bg-black/70 text-white p-4 text-center">
            <p className="text-sm font-medium mb-2">This bubble is overdue. What's next?</p>
            <div className="flex items-center gap-3">
                <Button variant="reflect" size="sm" onClick={() => setReflectingBlock(block)}>
                    Reflect
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setReschedulingBlock(block)}>
                    Reschedule
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="link-destructive" size="sm" onClick={e => e.stopPropagation()}>
                            Dismiss
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
        </div>
      )}

      <div
        className={cn(
          "absolute -top-px left-0 w-full h-2 cursor-n-resize z-20 resize-handle",
          "hover:bg-blue-400/20 transition-all duration-200",
          isResizing === 'top' && "bg-blue-400/40"
        )}
        onMouseDown={isInteractive ? (e) => handleResizeMouseDown(e, 'top') : undefined}
      />
      <div
        className={cn(
          "absolute -bottom-px left-0 w-full h-2 cursor-s-resize z-20 resize-handle",
          "hover:bg-blue-400/20 transition-all duration-200",
          isResizing === 'bottom' && "bg-blue-400/40"
        )}
        onMouseDown={isInteractive ? (e) => handleResizeMouseDown(e, 'bottom') : undefined}
      />
    </div>
    <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    </>
  );
}

// Custom comparison function for React.memo
const areBubblesEqual = (prevProps: TimeBubbleProps, nextProps: TimeBubbleProps) => {
    // Basic checks first
    // zoomLevel is not part of TimeBubbleProps; compare only defined props
    if (prevProps.timelineRef !== nextProps.timelineRef || prevProps.scrollContainerRef !== nextProps.scrollContainerRef) {
        return false;
    }

    const prevBlock = prevProps.block;
    const nextBlock = nextProps.block;
    
    // Compare all relevant properties of the block
    return (
        prevBlock.id === nextBlock.id &&
        prevBlock.title === nextBlock.title &&
        ensureDateObject(prevBlock.startTime).getTime() === ensureDateObject(nextBlock.startTime).getTime() &&
        prevBlock.duration === nextBlock.duration &&
        prevBlock.color === nextBlock.color &&
        prevBlock.category === nextBlock.category &&
        prevBlock.completed === nextBlock.completed &&
        prevBlock.actionable === nextBlock.actionable &&
        prevBlock.description === nextBlock.description &&
        prevBlock.notified === nextBlock.notified
    );
};

export const TimeBubble = React.memo(TimeBubbleComponent, areBubblesEqual);
