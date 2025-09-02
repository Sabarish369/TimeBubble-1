'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Repeat, Sparkles } from 'lucide-react';

interface RecurringSyncConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bubbleTitle: string;
  changeType: 'moved' | 'resized' | 'changed';
}

export function RecurringSyncConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  bubbleTitle,
  changeType
}: RecurringSyncConfirmationModalProps) {
  const getChangeDescription = () => {
    switch (changeType) {
      case 'moved':
        return 'moved';
      case 'resized':
        return 'resized';
      case 'changed':
        return 'modified';
      default:
        return 'changed';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-blue-500" />
            Sync Recurring Bubbles?
          </DialogTitle>
          <DialogDescription className="text-left">
            You've {getChangeDescription()} the recurring bubble "{bubbleTitle}". 
            Would you like to apply these changes to all future bubbles in this recurring series?
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 my-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">What happens when you sync:</p>
              <ul className="space-y-1 text-xs">
                <li>• All future bubbles in this series will be updated</li>
                <li>• Past bubbles remain unchanged</li>
                <li>• Conflicts will be resolved automatically</li>
                <li>• You'll be notified of any adjustments made</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            No, Keep Individual
          </Button>
          <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Yes, Sync All Future
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
