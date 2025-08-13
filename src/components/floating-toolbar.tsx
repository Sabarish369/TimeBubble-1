
'use client';

import { Undo2, Redo2, Trash2 } from 'lucide-react';
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
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { ZoomControls } from './zoom-controls';
import { SIDEBAR_WIDTH } from '@/lib/constants';

export function FloatingToolbar() {
  const {
    clearAllBlocks,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTimeBubbles();

  return (
    <div 
      className="absolute bottom-6 z-40"
      style={{ 
        left: `calc(${SIDEBAR_WIDTH}px + (100% - ${SIDEBAR_WIDTH}px) / 2)`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-1 p-1.5 rounded-full border bg-background/70 backdrop-blur-lg shadow-lg">
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
          <Undo2 className="h-5 w-5" />
          <span className="sr-only">Undo</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
          <Redo2 className="h-5 w-5" />
          <span className="sr-only">Redo</span>
        </Button>
        <div className='w-px h-6 bg-border mx-1'></div>
        <ZoomControls />
        <div className='w-px h-6 bg-border mx-1'></div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost-destructive" size="icon">
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
      </div>
    </div>
  );
}
