
'use client';

import type { TimeBlock as TimeBlockType } from '@/types';
import type { MouseEvent, RefObject } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { BUBBLE_COLORS, HOUR_HEIGHT, TOTAL_HOURS, BUBBLE_COLOR_NAMES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, Copy, MoreVertical, Trash2, MessageSquareText, Edit, Briefcase, BookOpen, Coffee, User, Heart, type LucideIcon, History, Undo, Repeat } from 'lucide-react';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { RecurringSyncConfirmationModal } from './recurring-sync-confirmation-modal';
import { ConflictNotificationModal } from './conflict-notification-modal';
import { RecurringDeleteConfirmationModal } from './recurring-delete-confirmation-modal';
import { useSmartSuggestions } from '@/hooks/use-smart-suggestions';
import { SmartSuggestionOverlay } from './smart-suggestion-overlay';

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
  const { updateBlock, deleteBlock, duplicateBlock, setReflectingBlock, setEditingBlock, setSelectedBlock, setReschedulingBlock, setBubbleDragInProgress, zoomLevel, currentDate, syncRecurringBubbles, deleteAllFutureRecurringBubbles } = useTimeBubbles();
  // Smart suggestions integration
  const {
    suggestions,
    activeSuggestion,
    showTooltip,
    generateSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    dismissAllSuggestions,
    hideTooltip
  } = useSmartSuggestions();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [didMove, setDidMove] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSyncConfirmationOpen, setIsSyncConfirmationOpen] = useState(false);
  const [isConflictNotificationOpen, setIsConflictNotificationOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ startTime: Date; duration: number } | null>(null);
  const [syncConflicts, setSyncConflicts] = useState<any[]>([]);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [changeType, setChangeType] = useState<'moved' | 'resized' | 'changed'>('changed');
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
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
      // Set a simple position since celebration is now relative to bubble
      setCelebrationPosition({ x: 0, y: 0 });
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 4000); // Show for 4 seconds
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
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef<'top' | 'bottom' | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    if (e.target !== e.currentTarget) {
        const targetElement = e.target as HTMLElement;
        if (targetElement.closest('button') || targetElement.closest('.resize-handle')) {
            return;
        }
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    isDraggingRef.current = true;
    isResizingRef.current = null;
    setBubbleDragInProgress(true);
    setIsDragging(true);
    setDidMove(false);
    const top = (ensureDateObject(block.startTime).getHours() * 60 + ensureDateObject(block.startTime).getMinutes()) * pixelsPerMinute;
    dragStartRef.current = { y: e.clientY, initialTop: top, initialHeight: 0 };
    
    // Generate suggestions when starting to move a bubble
    generateSuggestions('moving', block);
    setShowSuggestions(true);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, direction: 'top' | 'bottom') => {
    if (!e.isPrimary) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    isDraggingRef.current = false;
    isResizingRef.current = direction;
    setBubbleDragInProgress(true);
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

  const handlePointerUp = useCallback(() => {
    const wasDragging = isDraggingRef.current;
    const resizeDirection = isResizingRef.current;
    if (wasDragging || resizeDirection) {
      const hasChanged = 
        liveStartTime.getTime() !== ensureDateObject(block.startTime).getTime() ||
        liveDuration !== block.duration;
      
      if (hasChanged && block.recurringId) {
        // Store the pending update and show confirmation modal
        setPendingUpdate({ startTime: liveStartTime, duration: liveDuration });
        setChangeType(wasDragging ? 'moved' : 'resized');
        setIsSyncConfirmationOpen(true);
      } else {
        // Apply update immediately for non-recurring bubbles or no changes
        updateBlock(block.id, { startTime: liveStartTime, duration: liveDuration }, true);
        
        // Haptic feedback for tactile feel on mobile
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate(12); } catch (_) {}
        }

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
    }
    isDraggingRef.current = false;
    isResizingRef.current = null;
    setBubbleDragInProgress(false);
    setIsDragging(false);
    setIsResizing(null);
    setDragOffset({ x: 0, y: 0 });
    setShowSuggestions(false);
    stopAutoScroll();
  }, [block.id, block.recurringId, liveStartTime, liveDuration, updateBlock, stopAutoScroll, block.startTime, block.duration, setBubbleDragInProgress]);


  const handlePointerMove = useCallback((e: PointerEvent) => {
    const isDraggingNow = isDraggingRef.current;
    const resizeDirection = isResizingRef.current;
    if (!isDraggingNow && !resizeDirection) return;
    
    const deltaY = e.clientY - dragStartRef.current.y;
    if (Math.abs(deltaY) > 3) { // Threshold to detect actual movement
      setDidMove(true);
    }
    
    e.preventDefault();

    const timeline = timelineRef.current;
    if (!timeline) return;
    
    const timelineRect = timeline.getBoundingClientRect();
    const timelineEndMinutes = TOTAL_HOURS * 60;

    if (isDraggingNow) {
      const maxMinutes = timelineEndMinutes - liveDuration;
      const newTop = dragStartRef.current.initialTop + deltaY;
      const newMinutesRaw = newTop / pixelsPerMinute;
      const newMinutes = Math.max(0, Math.min(newMinutesRaw, maxMinutes));
      const newStartTime = new Date(liveStartTime);
      newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
      
      setLiveStartTime(newStartTime);
    }

    if (resizeDirection) {
      if (resizeDirection === 'bottom') {
        const newHeight = dragStartRef.current.initialHeight + deltaY;
        const currentStartMinutes = liveStartTime.getHours() * 60 + liveStartTime.getMinutes();
        const maxDuration = timelineEndMinutes - currentStartMinutes;
        const newDuration = Math.min(maxDuration, Math.max(15, newHeight / pixelsPerMinute));
        setLiveDuration(newDuration);
      }
      if (resizeDirection === 'top') {
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


  }, [pixelsPerMinute, scrollContainerRef, stopAutoScroll, liveStartTime, block, liveDuration, timelineRef]);


  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      stopAutoScroll();
    };
  }, [isDragging, isResizing, handlePointerMove, handlePointerUp, stopAutoScroll]);

  useEffect(() => {
    return () => {
      isDraggingRef.current = false;
      isResizingRef.current = null;
      setBubbleDragInProgress(false);
      stopAutoScroll();
    };
  }, [setBubbleDragInProgress, stopAutoScroll]);
  
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
    transform: isDragging 
      ? `rotate(${Math.sin(Date.now() * 0.002) * 0.2}deg) scale(1.01)` 
      : isHovering 
        ? 'scale(1.005) translateY(-0.5px)' 
        : 'scale(1)',
    transition: isDragging || isResizing ? 'none' : 'all 0.2s ease-out',
    zIndex: isDragging ? 40 : isHovering ? 20 : 'auto',
    filter: isDragging 
      ? `drop-shadow(0 8px 20px rgba(0, 0, 0, 0.15))` 
      : isHovering 
        ? `drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))`
        : `drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))`,
    overflow: 'hidden',
    touchAction: 'none',
    // Set the CSS variable for the glow color to match the bubble's color
    '--bubble-glow-color': `var(--bubble-${block.color})`
  } as React.CSSProperties;
  
  const handleUndoComplete = () => {
    updateBlock(block.id, { completed: false, reflection: undefined, notified: false });
    setShowCelebration(false);
  };
  
  const handleColorSelect = (colorName: keyof typeof BUBBLE_COLORS) => {
    updateBlock(block.id, { color: colorName });
  };

  const handleSyncConfirm = async () => {
    if (!pendingUpdate) return;
    
    try {
      // First update the current bubble
      updateBlock(block.id, { startTime: pendingUpdate.startTime, duration: pendingUpdate.duration }, true);
      
      // Then sync to other recurring bubbles
      const result = await syncRecurringBubbles(block.id, {
        startTime: pendingUpdate.startTime,
        duration: pendingUpdate.duration
      });
      
      setSyncConflicts(result.conflicts);
      setUpdatedCount(result.updated);
      
      if (result.conflicts.length > 0) {
        setIsConflictNotificationOpen(true);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
    
    setPendingUpdate(null);
    setIsSyncConfirmationOpen(false);
  };

  const handleSyncCancel = () => {
    if (pendingUpdate) {
      // Just update the current bubble without syncing
      updateBlock(block.id, { startTime: pendingUpdate.startTime, duration: pendingUpdate.duration }, true);
    }
    setPendingUpdate(null);
    setIsSyncConfirmationOpen(false);
  };

  const handleDelete = (bubbleId: string) => {
    if (block.recurringId) {
      // Show confirmation for recurring bubbles
      setPendingDeleteId(bubbleId);
      setIsDeleteConfirmationOpen(true);
    } else {
      // Delete immediately for non-recurring bubbles
      deleteBlock(bubbleId);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;
    
    try {
      // Delete the current bubble first
      deleteBlock(pendingDeleteId);
      
      // Then delete all future recurring bubbles
      await deleteAllFutureRecurringBubbles(pendingDeleteId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
    
    setPendingDeleteId(null);
    setIsDeleteConfirmationOpen(false);
  };

  const handleDeleteCancel = () => {
    if (pendingDeleteId) {
      // Just delete the current bubble without syncing
      deleteBlock(pendingDeleteId);
    }
    setPendingDeleteId(null);
    setIsDeleteConfirmationOpen(false);
  };

  return (
    <>
    <div
      data-bubble-id={block.id}
      className={cn(
        'absolute left-[50px] md:left-[80px] w-[calc(100%-70px)] md:w-[calc(100%-100px)] rounded-xl p-2 md:p-3 flex flex-col items-start time-bubble',
        'select-none border border-white/10',
        isDragging && 'cursor-grabbing drag-active time-bubble-dragging',
        isResizing && 'resize-active',
        isHovering && !isDragging && !isResizing && 'hover-active',
        showAsCurrent && 'is-glowing',
        isInteractive && !isDragging && 'cursor-pointer transition-all duration-200 ease-out'
      )}
      style={bubbleStyle}
      onPointerDown={isInteractive ? handlePointerDown : undefined}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={isInteractive ? handleClick : undefined}
    >
       <div 
        className={cn("absolute inset-0 rounded-xl")}
        style={{
          background: block.completed 
            ? 'linear-gradient(135deg, hsl(140, 50%, 65%) 0%, hsl(140, 45%, 55%) 100%)' 
            : `linear-gradient(135deg, hsl(var(--bubble-${block.color}) / 0.9) 0%, hsl(var(--bubble-${block.color}) / 0.7) 100%)`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
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
      
      {/* Smart Suggestions Overlay - only show during drag */}
      {showSuggestions && suggestions.length > 0 && isDragging && (
        <SmartSuggestionOverlay
          suggestions={suggestions}
          activeSuggestion={activeSuggestion}
          isVisible={showSuggestions && isDragging}
          showTooltip={showTooltip}
          onAccept={acceptSuggestion}
          onDismiss={dismissSuggestion}
          onDismissAll={dismissAllSuggestions}
          onHideTooltip={hideTooltip}
          className="absolute -top-20 -right-4 z-50"
        />
      )}
      
      {/* Recurring indicator */}
      {block.recurringId && (
        <div className="absolute top-1 left-1 z-20">
          <div className="bg-blue-500 text-white rounded-full p-1 shadow-sm">
            <Repeat className="w-3 h-3" />
          </div>
        </div>
      )}
      
      <div className="absolute top-1 right-1 z-20 flex items-center" style={{ opacity: isOverdue ? 0 : 1}}>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 cursor-pointer" onClick={(e) => {e.stopPropagation(); setEditingBlock(block)}}>
            <Edit className="w-4 h-4 text-slate-700 dark:text-white" />
        </Button>
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
              <AlertDialogAction onClick={() => handleDelete(block.id)}>Delete</AlertDialogAction>
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
                <div className="text-xs text-muted-foreground px-2 pt-1 pb-2">Colors</div>
                <div className="flex flex-wrap gap-2 p-2 max-w-[200px]">
                {BUBBLE_COLOR_NAMES.map((colorName) => (
                    <button
                    key={colorName}
                    className={cn("w-6 h-6 rounded-full border", block.color === colorName && "ring-2 ring-ring")}
                    style={{ backgroundColor: `hsl(var(--bubble-${colorName}))` }}
                    onClick={() => updateBlock(block.id, { color: colorName as keyof typeof BUBBLE_COLORS })}
                    />
                ))}
                </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={cn("w-full h-full pointer-events-none relative z-10 flex-1")}>
        {showFullContent ? (
          <div className={cn("flex-grow overflow-hidden flex items-center gap-2 md:gap-3 h-full")}>
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white drop-shadow-sm shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm md:text-base font-semibold text-white drop-shadow-sm pointer-events-none truncate">{block.title}</p>
              <p className="text-xs md:text-sm text-white/90 drop-shadow-sm pointer-events-none">
                {format(startTimeToDisplay, 'p')} - {format(endTimeToDisplay, 'p')}
              </p>
            </div>
          </div>
        ) : showCompactContent ? (
           <div className={cn("flex-grow overflow-hidden flex items-center gap-2 md:gap-3 h-full")}>
            <Icon className="h-5 w-5 text-white drop-shadow-sm shrink-0" />
            <p className="text-sm font-semibold text-white drop-shadow-sm pointer-events-none truncate">{block.title}</p>
          </div>
        ) : (
          <div className='w-full h-full flex items-center justify-center pointer-events-none'>
            <p className="text-xs font-semibold text-white drop-shadow-sm truncate px-2">{block.title}</p>
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
                            <AlertDialogAction onClick={() => handleDelete(block.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      )}

      <div
        className={cn(
          "absolute -top-3 left-0 w-full h-6 cursor-n-resize z-20 resize-handle flex items-center justify-center touch-none",
          "hover:bg-blue-400/20 active:bg-blue-400/40 transition-all duration-200",
          isResizing === 'top' && "bg-blue-400/40"
        )}
        onPointerDown={isInteractive ? (e) => handleResizePointerDown(e, 'top') : undefined}
      >
        <div className="w-12 h-1 rounded-full bg-white/40 shadow-sm" />
      </div>
      <div
        className={cn(
          "absolute -bottom-3 left-0 w-full h-6 cursor-s-resize z-20 resize-handle flex items-center justify-center touch-none",
          "hover:bg-blue-400/20 active:bg-blue-400/40 transition-all duration-200",
          isResizing === 'bottom' && "bg-blue-400/40"
        )}
        onPointerDown={isInteractive ? (e) => handleResizePointerDown(e, 'bottom') : undefined}
      >
        <div className="w-12 h-1 rounded-full bg-white/40 shadow-sm" />
      </div>
    </div>
    <RecurringSyncConfirmationModal
      isOpen={isSyncConfirmationOpen}
      onClose={handleSyncCancel}
      onConfirm={handleSyncConfirm}
      bubbleTitle={block.title}
      changeType={changeType}
    />
    <ConflictNotificationModal
      isOpen={isConflictNotificationOpen}
      onClose={() => setIsConflictNotificationOpen(false)}
      conflicts={syncConflicts}
      updatedCount={updatedCount}
    />
    <RecurringDeleteConfirmationModal
      isOpen={isDeleteConfirmationOpen}
      onClose={handleDeleteCancel}
      onConfirm={handleDeleteConfirm}
      bubbleTitle={block.title}
    />
    </>
  );
}

// Custom comparison function for React.memo
const areBubblesEqual = (prevProps: TimeBubbleProps, nextProps: TimeBubbleProps) => {
    // Basic checks first
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
