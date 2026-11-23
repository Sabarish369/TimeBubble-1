'use client';

import { Undo2, Redo2, Trash2, AlertTriangle } from 'lucide-react';
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

export function FloatingToolbar() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    clearAllBlocks,
  } = useTimeBubbles();
  const isMobile = useIsMobile();
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isQuickDeleteModalOpen, setIsQuickDeleteModalOpen] = useState(false);

  return (
    <div 
      className={cn(
        "fixed z-40 transition-all pointer-events-auto",
        isMobile 
          ? "left-1/2 -translate-x-1/2 bottom-[calc(1rem+env(safe-area-inset-bottom))]" 
          : "bottom-6"
      )}
      style={!isMobile ? { 
        left: `calc(${SIDEBAR_WIDTH}px + (100% - ${SIDEBAR_WIDTH}px) / 2)`,
        transform: 'translateX(-50%)',
      } : {}}
    >
      <div className="flex items-center gap-1 p-1.5 rounded-full border border-border/60 bg-background/80 backdrop-blur-xl shadow-xl">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={undo} 
          disabled={!canUndo}
          className={cn("rounded-full", isMobile ? "h-11 w-11" : "h-9 w-9")}
        >
          <Undo2 className="h-5 w-5" />
          <span className="sr-only">Undo</span>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={redo} 
          disabled={!canRedo}
          className={cn("rounded-full", isMobile ? "h-11 w-11" : "h-9 w-9")}
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
              className={cn("rounded-full", isMobile ? "h-11 w-11" : "h-9 w-9")}
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