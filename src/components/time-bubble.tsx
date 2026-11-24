
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
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const categoryIcons: Record<BubbleCategory, LucideIcon> = {
  work: Briefcase,
  study: BookOpen,
  break: Coffee,
  personal: User,
  health: Heart,
};

function TimeBubbleComponent({ block, timelineRef, scrollContainerRef, isSelected: isActive, onSelect }: TimeBubbleProps) {
  const { updateBlock, deleteBlock, duplicateBlock, setReflectingBlock, setEditingBlock, setSelectedBlock, selectedBlock, setReschedulingBlock, setBubbleDragInProgress, zoomLevel, currentDate, syncRecurringBubbles, deleteAllFutureRecurringBubbles } = useTimeBubbles();
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
  const didMoveRef = useRef(false);
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
  const autoScrollRafRef = useRef<number | null>(null);
  const autoScrollDirectionRef = useRef<'up' | 'down' | null>(null);
  const pointerClientYRef = useRef(0);
  const scrollMomentumRafRef = useRef<number | null>(null);


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


  const dragStartRef = useRef({ y: 0, initialTop: 0, initialHeight: 0, initialScrollTop: 0 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef<'top' | 'bottom' | null>(null);
  const lastPointerTypeRef = useRef<string | null>(null);
  const wasLongPressRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchPointerTrackingRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastY: number;
    lastTimestamp: number;
    velocity: number;
    mode: 'pending' | 'scrolling';
    scrollContainer: HTMLElement | null;
  } | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
    autoScrollDirectionRef.current = null;
  }, []);

  const handlePendingTouchMove = useCallback((e: PointerEvent) => {
    const tracking = touchPointerTrackingRef.current;
    if (!tracking || tracking.pointerId !== e.pointerId) return;

    if (tracking.mode === 'pending') {
      if (Math.hypot(e.clientX - tracking.startX, e.clientY - tracking.startY) <= 6) return;
      clearLongPressTimer();
      tracking.mode = 'scrolling';
      setDidMove(true);
      didMoveRef.current = true;
    }

    const deltaY = e.clientY - tracking.lastY;
    const elapsed = Math.max(1, e.timeStamp - tracking.lastTimestamp);
    if (tracking.scrollContainer) tracking.scrollContainer.scrollTop -= deltaY;
    tracking.velocity = Math.max(-2.5, Math.min(2.5, -deltaY / elapsed));
    tracking.lastY = e.clientY;
    tracking.lastTimestamp = e.timeStamp;
    e.preventDefault();
  }, [clearLongPressTimer]);

  const finishPendingTouch = useCallback((e: PointerEvent) => {
    const tracking = touchPointerTrackingRef.current;
    if (tracking?.pointerId !== e.pointerId) return;
    clearLongPressTimer();
    touchPointerTrackingRef.current = null;
    if (e.type !== 'pointerup' || tracking.mode !== 'scrolling' || !tracking.scrollContainer) return;

    if (scrollMomentumRafRef.current !== null) cancelAnimationFrame(scrollMomentumRafRef.current);
    let velocity = tracking.velocity;
    let previousTime = performance.now();
    const continueMomentum = (time: number) => {
      const deltaTime = Math.min(32, time - previousTime);
      previousTime = time;
      tracking.scrollContainer!.scrollTop += velocity * deltaTime;
      velocity *= Math.exp(-deltaTime / 280);
      if (Math.abs(velocity) > 0.02) {
        scrollMomentumRafRef.current = requestAnimationFrame(continueMomentum);
      } else {
        scrollMomentumRafRef.current = null;
      }
    };
    scrollMomentumRafRef.current = requestAnimationFrame(continueMomentum);
  }, [clearLongPressTimer]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePendingTouchMove, { passive: false });
    window.addEventListener('pointerup', finishPendingTouch);
    window.addEventListener('pointercancel', finishPendingTouch);
    return () => {
      window.removeEventListener('pointermove', handlePendingTouchMove);
      window.removeEventListener('pointerup', finishPendingTouch);
      window.removeEventListener('pointercancel', finishPendingTouch);
      clearLongPressTimer();
      if (scrollMomentumRafRef.current !== null) cancelAnimationFrame(scrollMomentumRafRef.current);
    };
  }, [clearLongPressTimer, finishPendingTouch, handlePendingTouchMove]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    lastPointerTypeRef.current = e.pointerType;
    wasLongPressRef.current = false;

    if (e.target !== e.currentTarget) {
        const targetElement = e.target as HTMLElement;
        if (targetElement.closest('button') || targetElement.closest('.resize-handle')) {
            return;
        }
    }
    
    const currentTarget = e.currentTarget;
    const pointerId = e.pointerId;
    const pointerY = e.clientY;
    const isTouchPointer = e.pointerType === 'touch';
    const rect = currentTarget.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    const top = (ensureDateObject(block.startTime).getHours() * 60 + ensureDateObject(block.startTime).getMinutes()) * pixelsPerMinute;

    const activateDrag = () => {
      try {
        currentTarget.setPointerCapture(pointerId);
      } catch (_) {}

      isDraggingRef.current = true;
      isResizingRef.current = null;
      setBubbleDragInProgress(true);
      setDragOffset(offset);
      setIsDragging(true);
      setDidMove(false);
      didMoveRef.current = false;
      dragStartRef.current = {
        y: pointerY,
        initialTop: top,
        initialHeight: 0,
        initialScrollTop: scrollContainerRef.current?.scrollTop ?? 0,
      };
      onSelect(block.id);
      wasLongPressRef.current = isTouchPointer;

      if (window.innerWidth >= 768) {
        generateSuggestions('moving', block);
        setShowSuggestions(true);
      }

      if (isTouchPointer && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    };

    if (isTouchPointer) {
      clearLongPressTimer();
      const tracking: NonNullable<typeof touchPointerTrackingRef.current> = {
        pointerId,
        startX: e.clientX,
        startY: pointerY,
        lastY: pointerY,
        lastTimestamp: e.timeStamp,
        velocity: 0,
        mode: 'pending',
        scrollContainer: scrollContainerRef.current,
      };
      touchPointerTrackingRef.current = tracking;
      setDidMove(false);
      didMoveRef.current = false;
      if (scrollMomentumRafRef.current !== null) {
        cancelAnimationFrame(scrollMomentumRafRef.current);
        scrollMomentumRafRef.current = null;
      }
      longPressTimerRef.current = setTimeout(() => {
        if (touchPointerTrackingRef.current !== tracking || tracking.mode !== 'pending') return;
        touchPointerTrackingRef.current = null;
        longPressTimerRef.current = null;
        activateDrag();
      }, 150);
    } else {
      activateDrag();
    }
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
    clearLongPressTimer();
    touchPointerTrackingRef.current = null;
    setBubbleDragInProgress(true);
    setIsResizing(direction);
    setDidMove(false);
    didMoveRef.current = false;
    const top = (ensureDateObject(block.startTime).getHours() * 60 + ensureDateObject(block.startTime).getMinutes()) * pixelsPerMinute;
    const height = block.duration * pixelsPerMinute;
    dragStartRef.current = {
      y: e.clientY,
      initialTop: top,
      initialHeight: height,
      initialScrollTop: scrollContainerRef.current?.scrollTop ?? 0,
    };
  };
  
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (wasLongPressRef.current) {
      wasLongPressRef.current = false;
      lastPointerTypeRef.current = null;
      return;
    }
    if (didMove || didMoveRef.current) {
      lastPointerTypeRef.current = null;
      return;
    }
    if (e.target !== e.currentTarget) {
        const targetElement = e.target as HTMLElement;
        if (targetElement.closest('button') || targetElement.closest('.resize-handle')) {
            lastPointerTypeRef.current = null;
            return;
        }
    }
    e.stopPropagation();
    const pointerType = lastPointerTypeRef.current;
    lastPointerTypeRef.current = null;
    if (pointerType === 'touch') {
      if (isSelected) setSelectedBlock(block);
      else onSelect(block.id);
    } else {
      onSelect(block.id);
      setSelectedBlock(block);
    }
  };

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
    clearLongPressTimer();
    touchPointerTrackingRef.current = null;
    setBubbleDragInProgress(false);
    setIsDragging(false);
    setIsResizing(null);
    setDragOffset({ x: 0, y: 0 });
    setShowSuggestions(false);
    stopAutoScroll();
  }, [block.id, block.recurringId, liveStartTime, liveDuration, updateBlock, stopAutoScroll, block.startTime, block.duration, setBubbleDragInProgress]);

  const handlePointerCancel = useCallback(() => {
    if (!isDraggingRef.current && !isResizingRef.current) return;
    isDraggingRef.current = false;
    isResizingRef.current = null;
    wasLongPressRef.current = false;
    setLiveStartTime(ensureDateObject(block.startTime));
    setLiveDuration(block.duration);
    setBubbleDragInProgress(false);
    setIsDragging(false);
    setIsResizing(null);
    setDragOffset({ x: 0, y: 0 });
    setShowSuggestions(false);
    stopAutoScroll();
  }, [block.startTime, block.duration, setBubbleDragInProgress, stopAutoScroll]);


  const applyPointerPosition = useCallback((clientY: number) => {
    const resizeDirection = isResizingRef.current;
    if (!isDraggingRef.current && !resizeDirection) return;

    const scrollContainer = scrollContainerRef.current;
    const scrollDelta = (scrollContainer?.scrollTop ?? dragStartRef.current.initialScrollTop)
      - dragStartRef.current.initialScrollTop;
    const deltaY = clientY - dragStartRef.current.y + scrollDelta;
    if (Math.abs(deltaY) > 3) {
      setDidMove(true);
      didMoveRef.current = true;
    }

    const startMinutes = dragStartRef.current.initialTop / pixelsPerMinute;
    const timelineEndMinutes = TOTAL_HOURS * 60;
    const originalStartTime = ensureDateObject(block.startTime);

    if (isDraggingRef.current) {
      const maxMinutes = timelineEndMinutes - block.duration;
      const snappedMinutes = Math.round((dragStartRef.current.initialTop + deltaY) / pixelsPerMinute / 15) * 15;
      const newMinutes = Math.max(0, Math.min(snappedMinutes, maxMinutes));
      const newStartTime = new Date(originalStartTime);
      newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
      setLiveStartTime(newStartTime);
      return;
    }

    if (resizeDirection === 'bottom') {
      const rawDuration = (dragStartRef.current.initialHeight + deltaY) / pixelsPerMinute;
      const maxDuration = timelineEndMinutes - startMinutes;
      setLiveDuration(Math.min(maxDuration, Math.max(15, Math.round(rawDuration / 15) * 15)));
    } else if (resizeDirection === 'top') {
      const endMinutes = startMinutes + block.duration;
      const snappedStart = Math.round((startMinutes + deltaY / pixelsPerMinute) / 15) * 15;
      const newMinutes = Math.max(0, Math.min(endMinutes - 15, snappedStart));
      const newStartTime = new Date(originalStartTime);
      newStartTime.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
      setLiveStartTime(newStartTime);
      setLiveDuration(endMinutes - newMinutes);
    }
  }, [block.duration, block.startTime, pixelsPerMinute, scrollContainerRef]);

  const startAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current !== null) return;
    let previousTime = performance.now();

    const scrollFrame = (time: number) => {
      const scrollContainer = scrollContainerRef.current;
      const direction = autoScrollDirectionRef.current;
      if (!scrollContainer || !direction || (!isDraggingRef.current && !isResizingRef.current)) {
        autoScrollRafRef.current = null;
        return;
      }

      const rect = scrollContainer.getBoundingClientRect();
      const zone = 64;
      const pointerY = pointerClientYRef.current;
      const ratio = Math.min(1, direction === 'up'
        ? Math.max(0, (rect.top + zone - pointerY) / zone)
        : Math.max(0, (pointerY - (rect.bottom - zone)) / zone));
      const elapsedFrames = Math.min(2, Math.max(0.5, (time - previousTime) / 16));
      previousTime = time;
      scrollContainer.scrollTop += (direction === 'up' ? -1 : 1) * Math.ceil(ratio * 14) * elapsedFrames;
      applyPointerPosition(pointerY);
      autoScrollRafRef.current = requestAnimationFrame(scrollFrame);
    };

    autoScrollRafRef.current = requestAnimationFrame(scrollFrame);
  }, [applyPointerPosition, scrollContainerRef]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current && !isResizingRef.current) return;
    pointerClientYRef.current = e.clientY;
    e.preventDefault();
    applyPointerPosition(e.clientY);

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    const { top, bottom } = scrollContainer.getBoundingClientRect();
    autoScrollDirectionRef.current = e.clientY < top + 64
      ? 'up'
      : e.clientY > bottom - 64
        ? 'down'
        : null;

    if (autoScrollDirectionRef.current) startAutoScroll();
    else stopAutoScroll();
  }, [applyPointerPosition, scrollContainerRef, startAutoScroll, stopAutoScroll]);


  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerCancel);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      stopAutoScroll();
    };
  }, [isDragging, isResizing, handlePointerMove, handlePointerUp, handlePointerCancel, stopAutoScroll]);

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
  const isSelected = isActive || selectedBlock?.id === block.id;

  const bubbleStyle: React.CSSProperties = {
    top: `${top}px`,
    height: `${height}px`,
    transform: isDragging 
      ? `rotate(${Math.sin(Date.now() * 0.002) * 0.2}deg) scale(1.01)` 
      : isHovering 
        ? 'scale(1.005) translateY(-0.5px)' 
        : 'scale(1)',
    transition: isDragging || isResizing ? 'none' : 'all 0.2s ease-out',
    zIndex: isDragging ? 40 : isSelected ? 30 : isHovering ? 20 : 'auto',
    filter: isDragging 
      ? `drop-shadow(0 8px 20px rgba(0, 0, 0, 0.15))` 
      : isHovering 
        ? `drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))`
        : `drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))`,
    overflow: 'visible',
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
        'bubble-touch-surface select-none border border-white/10',
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
      {(isDragging || isResizing) && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-xl"
        >
          {format(startTimeToDisplay, 'p')} – {format(endTimeToDisplay, 'p')} ({Math.round(durationToDisplay)}m)
        </div>
      )}
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
      
      <div className="absolute top-1 right-1 z-20 hidden items-center md:flex" style={{ opacity: isOverdue ? 0 : 1}}>
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
            <Icon className="hidden h-5 w-5 shrink-0 text-white drop-shadow-sm md:block md:h-6 md:w-6" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm md:text-base font-semibold text-white drop-shadow-sm pointer-events-none truncate">{block.title}</p>
              <p className="text-xs md:text-sm text-white/90 drop-shadow-sm pointer-events-none">
                {format(startTimeToDisplay, 'p')} - {format(endTimeToDisplay, 'p')}
              </p>
            </div>
          </div>
        ) : showCompactContent ? (
           <div className={cn("flex-grow overflow-hidden flex items-center gap-2 md:gap-3 h-full")}>
            <Icon className="hidden h-5 w-5 shrink-0 text-white drop-shadow-sm md:block" />
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
        <div className="absolute inset-0 z-20 hidden rounded-lg flex-col items-center justify-center gap-2 bg-black/70 p-4 text-center text-white md:flex">
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

      {isSelected && !isDragging && !isResizing && (
        <div
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          className="absolute -bottom-12 left-1/2 z-40 flex w-max max-w-[calc(100vw_-_1rem)] -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-background/95 p-1 shadow-xl backdrop-blur-md md:hidden"
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${block.title}`}
            className="h-11 w-11 rounded-full"
            onClick={() => setEditingBlock(block)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Log mood for ${block.title}`}
            className="h-11 w-11 rounded-full"
            onClick={() => setReflectingBlock(block)}
          >
            <MessageSquareText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Duplicate ${block.title}`}
            className="h-11 w-11 rounded-full"
            onClick={() => duplicateBlock(block.id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${block.title}`}
                className="h-11 w-11 rounded-full text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this bubble?</AlertDialogTitle>
                <AlertDialogDescription>
                  Delete "{block.title}" from this day? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(block.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div
        className={cn(
          "resize-handle absolute -top-4 left-2 z-30 hidden h-9 w-9 cursor-ns-resize items-center justify-center rounded-full touch-none md:-top-3 md:left-0 md:flex md:h-6 md:w-full md:cursor-n-resize md:rounded-none",
          "hover:bg-blue-400/20 active:bg-blue-400/40 transition-all duration-200",
          isSelected && "max-md:flex",
          isResizing === 'top' && "bg-blue-400/40"
        )}
        onPointerDown={isInteractive ? (e) => handleResizePointerDown(e, 'top') : undefined}
      >
        <div className="h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shadow-md md:h-1 md:w-12 md:rounded-full md:border-0 md:bg-white/80" />
      </div>
      <div
        className={cn(
          "resize-handle absolute -bottom-4 right-2 z-30 hidden h-9 w-9 cursor-ns-resize items-center justify-center rounded-full touch-none md:-bottom-3 md:right-0 md:flex md:h-6 md:w-full md:rounded-none",
          "hover:bg-blue-400/20 active:bg-blue-400/40 transition-all duration-200",
          isSelected && "max-md:flex",
          isResizing === 'bottom' && "bg-blue-400/40"
        )}
        onPointerDown={isInteractive ? (e) => handleResizePointerDown(e, 'bottom') : undefined}
      >
        <div className="h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shadow-md md:h-1 md:w-12 md:rounded-full md:border-0 md:bg-white/80" />
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
    if (
      prevProps.timelineRef !== nextProps.timelineRef ||
      prevProps.scrollContainerRef !== nextProps.scrollContainerRef ||
      prevProps.isSelected !== nextProps.isSelected ||
      prevProps.onSelect !== nextProps.onSelect
    ) {
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
