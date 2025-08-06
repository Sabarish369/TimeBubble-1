
'use client';

import { format } from 'date-fns';
import { Sparkles, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

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
import { TimeBubbleLogo } from '@/components/timebubble-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { SmartSuggestions } from '@/components/smart-suggestions';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Slider } from './ui/slider';
import { MIN_ZOOM, MAX_ZOOM } from '@/lib/constants';

export function Header() {
  const { clearAllBlocks, zoomLevel, setZoomLevel } = useTimeBubbles();

  return (
    <header className="flex items-center justify-between p-4 border-b shrink-0 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <TimeBubbleLogo className="h-6 w-auto" />
      </div>
      <div className="flex-1 flex justify-center items-center gap-4">
        <span className="text-lg font-semibold text-foreground/80">
          {format(new Date(), 'EEEE, MMMM do')}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 w-32">
          <ZoomOut className="h-5 w-5" />
            <Slider
              value={[zoomLevel]}
              onValueChange={(value) => setZoomLevel(value[0])}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.1}
            />
          <ZoomIn className="h-5 w-5" />
        </div>
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
                This will permanently delete all time bubbles for today. This action cannot be undone.
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
