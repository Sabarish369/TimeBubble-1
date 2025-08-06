
'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, Trash2, Undo2, Redo2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimeBubbleLogo } from '@/components/timebubble-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { SmartSuggestions } from '@/components/smart-suggestions';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { cn } from '@/lib/utils';
import { ZoomControls } from './zoom-controls';

export function Header() {
  const {
    clearAllBlocks,
    undo,
    redo,
    canUndo,
    canRedo,
    currentDate,
    setCurrentDate,
    goToToday,
    goToNextDay,
    goToPreviousDay,
  } = useTimeBubbles();

  return (
    <header className="flex items-center justify-between p-4 border-b shrink-0 bg-gradient-to-r from-primary/10 via-background to-accent/10">
      <div className="flex items-center gap-4">
        <TimeBubbleLogo className="h-6 w-auto" />
      </div>
      <div className="flex-1 flex justify-center items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousDay}>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous day</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'ghost'}
                className={cn(
                  'w-[200px] justify-center text-center font-semibold text-lg',
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {format(currentDate, 'MMMM do, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextDay}>
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next day</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
            <Undo2 className="h-5 w-5" />
            <span className="sr-only">Undo</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
            <Redo2 className="h-5 w-5" />
            <span className="sr-only">Redo</span>
          </Button>
        </div>
        <ZoomControls />
        <SmartSuggestions />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Clear all bubbles</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all time bubbles for the selected day. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearAllBlocks}>
                Yes, clear all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <ThemeToggle />
      </div>
    </header>
  );
}
