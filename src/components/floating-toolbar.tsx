'use client';

import { Undo2, Redo2, Trash2, AlertTriangle, LayoutTemplate, CalendarPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { ZoomControls } from './zoom-controls';
import { SIDEBAR_WIDTH } from '@/lib/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DeleteAllBubblesModal } from './delete-all-bubbles-modal';
import { QuickDeleteConfirmModal } from './quick-delete-confirm-modal';
import { useState } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { defaultTemplates } from './sidebar';
import type { BubbleTemplate } from '@/types';
import { format, isToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { HOUR_HEIGHT } from '@/lib/constants';

interface FloatingToolbarProps {
  scrollContainerRef: RefObject<HTMLElement>;
}

interface TemplatePointerState {
  template: BubbleTemplate;
  pointerId: number;
  startX: number;
  startY: number;
  lastY: number;
  x: number;
  y: number;
  scrollContainer: HTMLElement | null;
  mode: 'arming' | 'scrolling' | 'dragging';
}

export function FloatingToolbar({ scrollContainerRef }: FloatingToolbarProps) {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    clearAllBlocks,
    templates,
    timeBlocks,
    currentDate,
    zoomLevel,
    addBlockOnDate,
    setIsBubbleCreateModalOpen,
  } = useTimeBubbles();
  const isMobile = useIsMobile();
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isQuickDeleteModalOpen, setIsQuickDeleteModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isTemplateSheetExpanded, setIsTemplateSheetExpanded] = useState(false);
  const [draggingTemplate, setDraggingTemplate] = useState<{ template: BubbleTemplate; x: number; y: number } | null>(null);
  const templatePointerRef = useRef<TemplatePointerState | null>(null);
  const templateLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const templateListRef = useRef<HTMLDivElement>(null);
  const templateSheetPointerStartYRef = useRef<number | null>(null);
  const templateSheetDidSwipeRef = useRef(false);
  const ignoreTemplateClickRef = useRef(false);
  const { toast } = useToast();

  const allTemplates = [
    ...defaultTemplates.map(template => {
      const override = templates.find(item => item.id === template.id);
      return override ? { ...template, ...override, isDefault: true } : template;
    }),
    ...templates.filter(template => !template.isDefault),
  ];

  const addTemplateToTimeline = (template: BubbleTemplate) => {
    const candidateBlocks = [...timeBlocks].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    const now = new Date();
    const scrollContainer = scrollContainerRef.current;
    const pixelsPerMinute = (HOUR_HEIGHT * zoomLevel) / 60;
    let startMinutes = scrollContainer
      ? Math.ceil(scrollContainer.scrollTop / pixelsPerMinute / 15) * 15
      : 9 * 60;
    if (isToday(currentDate)) {
      startMinutes = Math.max(startMinutes, Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15);
    }

    for (const block of candidateBlocks) {
      const blockStart = new Date(block.startTime).getHours() * 60 + new Date(block.startTime).getMinutes();
      const blockEnd = blockStart + block.duration;
      if (blockEnd <= startMinutes) continue;
      if (blockStart >= startMinutes + template.duration) break;
      startMinutes = Math.ceil(blockEnd / 15) * 15;
    }

    if (startMinutes + template.duration > 24 * 60) {
      toast({
        title: 'No room left today',
        description: 'There is not enough open time for this template.',
        variant: 'destructive',
      });
      return;
    }

    const startTime = new Date(currentDate);
    startTime.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    addBlockOnDate({
      title: template.title,
      description: template.description,
      duration: template.duration,
      category: template.category,
      color: template.color,
      startTime,
    }, currentDate);
    setIsTemplatesOpen(false);
    toast({
      title: `Added "${template.title}"`,
      description: `Scheduled for ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });
  };

  const getTemplateStartTimeAtPointer = useCallback((template: BubbleTemplate, clientY: number) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return null;

    const pixelsPerMinute = (HOUR_HEIGHT * zoomLevel) / 60;
    const minutesFromTop = (clientY - scrollContainer.getBoundingClientRect().top + scrollContainer.scrollTop) / pixelsPerMinute;
    const startMinutes = Math.max(0, Math.min(
      24 * 60 - template.duration,
      Math.round(minutesFromTop / 15) * 15,
    ));
    const startTime = new Date(currentDate);
    startTime.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    return startTime;
  }, [currentDate, scrollContainerRef, zoomLevel]);

  const addTemplateAtPointer = useCallback((template: BubbleTemplate, clientY: number) => {
    const startTime = getTemplateStartTimeAtPointer(template, clientY);
    if (!startTime) {
      toast({ title: 'Could not add template', description: 'The timeline is not available yet.', variant: 'destructive' });
      return;
    }

    void addBlockOnDate({
      title: template.title,
      description: template.description,
      duration: template.duration,
      category: template.category,
      color: template.color,
      startTime,
    }, currentDate);
    toast({ title: `Added "${template.title}"`, description: 'It was placed in the nearest available time slot.' });
  }, [addBlockOnDate, currentDate, getTemplateStartTimeAtPointer, toast]);

  const clearTemplateLongPress = useCallback(() => {
    if (templateLongPressRef.current !== null) {
      clearTimeout(templateLongPressRef.current);
      templateLongPressRef.current = null;
    }
  }, []);

  const handleTemplatePointerMove = useCallback((event: PointerEvent) => {
    const tracking = templatePointerRef.current;
    if (!tracking || tracking.pointerId !== event.pointerId) return;

    if (tracking.mode === 'arming') {
      if (Math.hypot(event.clientX - tracking.startX, event.clientY - tracking.startY) <= 6) return;
      clearTemplateLongPress();
      tracking.mode = 'scrolling';
      ignoreTemplateClickRef.current = true;
    }

    if (tracking.mode === 'scrolling') {
      const deltaY = event.clientY - tracking.lastY;
      if (tracking.scrollContainer) tracking.scrollContainer.scrollTop -= deltaY;
      tracking.lastY = event.clientY;
      event.preventDefault();
      return;
    }

    tracking.x = event.clientX;
    tracking.y = event.clientY;
    setDraggingTemplate({ template: tracking.template, x: tracking.x, y: tracking.y });
    event.preventDefault();
  }, [clearTemplateLongPress]);

  const finishTemplatePointer = useCallback((event: PointerEvent, cancelled: boolean) => {
    const tracking = templatePointerRef.current;
    if (!tracking || tracking.pointerId !== event.pointerId) return;
    clearTemplateLongPress();

    if (tracking.mode === 'dragging' && !cancelled) {
      ignoreTemplateClickRef.current = true;
      addTemplateAtPointer(tracking.template, event.clientY);
      setIsTemplatesOpen(false);
    }
    templatePointerRef.current = null;
    setDraggingTemplate(null);
  }, [addTemplateAtPointer, clearTemplateLongPress]);

  useEffect(() => {
    window.addEventListener('pointermove', handleTemplatePointerMove, { passive: false });
    const handlePointerUp = (event: PointerEvent) => finishTemplatePointer(event, false);
    const handlePointerCancel = (event: PointerEvent) => finishTemplatePointer(event, true);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    return () => {
      window.removeEventListener('pointermove', handleTemplatePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      clearTemplateLongPress();
    };
  }, [clearTemplateLongPress, finishTemplatePointer, handleTemplatePointerMove]);

  const handleTemplatePointerDown = (template: BubbleTemplate, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary) return;
    ignoreTemplateClickRef.current = false;
    if (event.pointerType !== 'touch') return;
    clearTemplateLongPress();
    const tracking: TemplatePointerState = {
      template,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      scrollContainer: templateListRef.current,
      mode: 'arming',
    };
    templatePointerRef.current = tracking;
    templateLongPressRef.current = setTimeout(() => {
      if (templatePointerRef.current !== tracking) return;
      const captureTarget = scrollContainerRef.current;
      if (!captureTarget) {
        templatePointerRef.current = null;
        toast({ title: 'Could not start template drag', description: 'The timeline is not available yet.', variant: 'destructive' });
        return;
      }
      try {
        captureTarget.setPointerCapture(tracking.pointerId);
      } catch (error) {
        console.error('Could not capture template drag pointer:', error);
        templatePointerRef.current = null;
        toast({ title: 'Could not start template drag', description: 'Please try again.', variant: 'destructive' });
        return;
      }
      tracking.mode = 'dragging';
      setDraggingTemplate({ template, x: tracking.x, y: tracking.y });
      setIsTemplatesOpen(false);
    }, 150);
  };

  const draggingTemplateStartTime = draggingTemplate
    ? getTemplateStartTimeAtPointer(draggingTemplate.template, draggingTemplate.y)
    : null;

  if (isMobile) {
    return (
      <>
        <Sheet
          open={isTemplatesOpen}
          onOpenChange={open => {
            setIsTemplatesOpen(open);
            if (open) setIsTemplateSheetExpanded(false);
          }}
        >
          <SheetContent side="bottom" className={cn("rounded-t-2xl pb-safe", isTemplateSheetExpanded ? "h-[85dvh]" : "h-[35dvh]")}>
            <button
              type="button"
              aria-label={isTemplateSheetExpanded ? "Collapse template picker" : "Expand template picker"}
              aria-expanded={isTemplateSheetExpanded}
              className="mx-auto mb-2 flex h-8 w-full items-center justify-center"
              style={{ touchAction: 'none' }}
              onPointerDown={event => {
                templateSheetPointerStartYRef.current = event.clientY;
                templateSheetDidSwipeRef.current = false;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={event => {
                const startY = templateSheetPointerStartYRef.current;
                templateSheetPointerStartYRef.current = null;
                if (startY === null || Math.abs(event.clientY - startY) < 12) return;
                templateSheetDidSwipeRef.current = true;
                setIsTemplateSheetExpanded(event.clientY < startY);
              }}
              onPointerCancel={() => {
                templateSheetPointerStartYRef.current = null;
              }}
              onClick={() => {
                if (templateSheetDidSwipeRef.current) {
                  templateSheetDidSwipeRef.current = false;
                  return;
                }
                setIsTemplateSheetExpanded(expanded => !expanded);
              }}
            >
              <span className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
            </button>
            <SheetHeader>
              <SheetTitle>Templates</SheetTitle>
              <SheetDescription>Choose a template to add it to the next available time.</SheetDescription>
            </SheetHeader>
            <div
              ref={templateListRef}
              className={cn(
                "mt-4 grid grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2",
                isTemplateSheetExpanded ? "max-h-[calc(85dvh_-_8rem)]" : "max-h-[calc(35dvh_-_8rem)]",
              )}
            >
              {allTemplates.map(template => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto min-h-12 justify-start gap-3 whitespace-normal px-4 py-3 text-left"
                  style={{ touchAction: 'none' }}
                  onPointerDown={event => handleTemplatePointerDown(template, event)}
                  onClick={() => {
                    if (ignoreTemplateClickRef.current) {
                      ignoreTemplateClickRef.current = false;
                      return;
                    }
                    addTemplateToTimeline(template);
                  }}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: `hsl(var(--bubble-${template.color}))` }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{template.title}</span>
                    <span className="block text-xs text-muted-foreground">{template.duration} min</span>
                  </span>
                </Button>
              ))}
              <Button
                variant="ghost"
                className="min-h-12 justify-start"
                onClick={() => {
                  setIsTemplatesOpen(false);
                  window.dispatchEvent(new CustomEvent('openTemplateModal'));
                }}
              >
                Create a template
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="fixed bottom-[calc(0.5rem_+_env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%_-_2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/90 p-2 shadow-xl backdrop-blur-xl md:hidden">
          <Button variant="ghost" className="min-h-12 min-w-0 flex-1 flex-col gap-1 px-2" onClick={() => setIsTemplatesOpen(true)}>
            <LayoutTemplate className="h-5 w-5" />
            <span className="text-xs">Templates</span>
          </Button>
          <Button className="min-h-12 min-w-0 flex-1 flex-col gap-1 px-2" onClick={() => setIsBubbleCreateModalOpen(true)}>
            <CalendarPlus className="h-5 w-5" />
            <span className="text-xs">Add Bubble</span>
          </Button>
          <Button variant="ghost" className="min-h-12 min-w-0 flex-1 flex-col gap-1 px-2" onClick={() => window.dispatchEvent(new CustomEvent('openAIOptimizer'))}>
            <Sparkles className="h-5 w-5" />
            <span className="text-xs">AI Coach</span>
          </Button>
        </div>
        {draggingTemplate && (
          <div
            className="pointer-events-none fixed z-[60] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-primary/40 bg-background/95 px-4 py-2 text-sm font-medium shadow-2xl"
            style={{ left: draggingTemplate.x, top: draggingTemplate.y }}
          >
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: `hsl(var(--bubble-${draggingTemplate.template.color}))` }} />
            <span>{draggingTemplate.template.title}</span>
            <span className="text-muted-foreground">
              {draggingTemplateStartTime ? format(draggingTemplateStartTime, 'p') : '--:--'}
            </span>
          </div>
        )}
      </>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-40 transition-all pointer-events-auto",
        "bottom-6"
      )}
      style={{
        left: `calc(${SIDEBAR_WIDTH}px + (100% - ${SIDEBAR_WIDTH}px) / 2)`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-1 p-1.5 rounded-full border border-border/60 bg-background/80 backdrop-blur-xl shadow-xl">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={undo} 
          disabled={!canUndo}
          className="h-9 w-9 rounded-full"
        >
          <Undo2 className="h-5 w-5" />
          <span className="sr-only">Undo</span>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={redo} 
          disabled={!canRedo}
          className="h-9 w-9 rounded-full"
        >
          <Redo2 className="h-5 w-5" />
          <span className="sr-only">Redo</span>
        </Button>
        <div className='w-px h-6 bg-border mx-1'></div>
        <ZoomControls />
        <div className='w-px h-6 bg-border mx-1'></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost-destructive" 
              size="icon"
              className="h-9 w-9 rounded-full"
            >
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Clear all bubbles</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => setIsQuickDeleteModalOpen(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              Delete Current Day
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
              Delete All Time
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DeleteAllBubblesModal 
        isOpen={isDeleteAllModalOpen} 
        onClose={() => setIsDeleteAllModalOpen(false)} 
      />
      <QuickDeleteConfirmModal 
        isOpen={isQuickDeleteModalOpen} 
        onClose={() => setIsQuickDeleteModalOpen(false)} 
        onConfirm={clearAllBlocks}
      />
    </div>
  );
}