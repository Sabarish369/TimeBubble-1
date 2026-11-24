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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { defaultTemplates } from './sidebar';
import type { BubbleTemplate } from '@/types';
import { isToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function FloatingToolbar() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    clearAllBlocks,
    templates,
    timeBlocks,
    currentDate,
    addBlockOnDate,
    setIsBubbleCreateModalOpen,
  } = useTimeBubbles();
  const isMobile = useIsMobile();
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isQuickDeleteModalOpen, setIsQuickDeleteModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
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
    let startMinutes = isToday(currentDate)
      ? Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15
      : 9 * 60;

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

  if (isMobile) {
    return (
      <>
        <Sheet open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
          <SheetContent side="bottom" className="h-[55dvh] rounded-t-2xl pb-safe">
            <SheetHeader>
              <SheetTitle>Templates</SheetTitle>
              <SheetDescription>Choose a template to add it to the next available time.</SheetDescription>
            </SheetHeader>
            <div className="mt-4 grid max-h-[calc(55dvh_-_8rem)] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {allTemplates.map(template => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto min-h-12 justify-start gap-3 whitespace-normal px-4 py-3 text-left"
                  onClick={() => addTemplateToTimeline(template)}
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