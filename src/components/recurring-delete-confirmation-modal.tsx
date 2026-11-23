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
import { Repeat, Trash2, AlertTriangle } from 'lucide-react';

interface RecurringDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bubbleTitle: string;
}

export function RecurringDeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  bubbleTitle
}: RecurringDeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-red-500" />
            Delete Recurring Bubbles?
          </DialogTitle>
          <DialogDescription className="text-left">
            You're deleting the recurring bubble "{bubbleTitle}". 
            Would you like to delete all future bubbles in this recurring series?
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 my-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-medium mb-1">What happens when you delete all:</p>
              <ul className="space-y-1 text-xs">
                <li>• All future bubbles in this series will be deleted</li>
                <li>• Past bubbles remain unchanged</li>
                <li>• This action cannot be undone</li>
                <li>• Only affects bubbles with the same recurring pattern</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            No, Keep Individual
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 mr-2" />
            Yes, Delete All Future
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
