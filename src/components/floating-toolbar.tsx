
'use client';

import { Undo2, Redo2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { ZoomControls } from './zoom-controls';
import { SIDEBAR_WIDTH } from '@/lib/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DeleteAllBubblesModal } from './delete-all-bubbles-modal';
import { useState } from 'react';

export function FloatingToolbar() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTimeBubbles();
  const isMobile = useIsMobile();
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  return (
    <div 
      className={cn(
        "absolute bottom-6 z-40",
        isMobile ? "left-1/2 -translate-x-1/2" : ""
      )}
      style={!isMobile ? { 
        left: `calc(${SIDEBAR_WIDTH}px + (100% - ${SIDEBAR_WIDTH}px) / 2)`,
        transform: 'translateX(-50%)',
      } : {}}
    >
      <div className="flex items-center gap-1 p-1.5 rounded-full border bg-background/60 backdrop-blur-lg shadow-lg">
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
        <Button 
          variant="ghost-destructive" 
          size="icon"
          onClick={() => setIsDeleteAllModalOpen(true)}
        >
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Clear all bubbles</span>
        </Button>
      </div>
      <DeleteAllBubblesModal 
        isOpen={isDeleteAllModalOpen} 
        onClose={() => setIsDeleteAllModalOpen(false)} 
      />
    </div>
  );
}
