
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import type { TimeBlock } from '@/types';
import { MessageSquareText, History, XCircle, Trash2 } from 'lucide-react';

interface ActionPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: TimeBlock | null | undefined;
}

export function ActionPromptModal({ isOpen, onClose, block }: ActionPromptModalProps) {
  const { setReflectingBlock, setReschedulingBlock, updateBlock, deleteBlock } = useTimeBubbles();

  if (!block) return null;

  const handleReflect = () => {
    setReflectingBlock(block);
    onClose();
  };
  
  const handleReschedule = () => {
    setReschedulingBlock(block);
    onClose();
  };

  const handleMarkAsMissed = () => {
    // Mark as missed but don't complete it.
    // Set actionable to false so it doesn't pop up again.
    updateBlock(block.id, { completed: false, actionable: false });
    onClose();
  };

  const handleDelete = () => {
    deleteBlock(block.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Time's up for "{block.title}"!</DialogTitle>
          <DialogDescription className="text-center">
            How did it go? Log your progress to keep your timeline accurate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button variant="default" size="lg" className="h-20 flex-col gap-1" onClick={handleReflect}>
            <MessageSquareText />
            Reflect & Complete
          </Button>
          <Button variant="secondary" size="lg" className="h-20 flex-col gap-1" onClick={handleReschedule}>
            <History />
            Reschedule
          </Button>
          <Button variant="secondary" size="lg" className="h-20 flex-col gap-1" onClick={handleMarkAsMissed}>
            <XCircle />
            Mark as Missed
          </Button>
           <Button variant="ghost-destructive" size="lg" className="h-20 flex-col gap-1 border border-destructive/50" onClick={handleDelete}>
            <Trash2 />
            Delete Bubble
          </Button>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button type="button" variant="ghost" onClick={onClose}>
            Decide Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
