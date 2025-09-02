'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useTimeBubbles } from '@/context/time-bubbles-context';

interface QuickDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function QuickDeleteConfirmModal({ isOpen, onClose, onConfirm }: QuickDeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { timeBlocks } = useTimeBubbles();
  
  const bubbleCount = timeBlocks.length;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Current Day
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete all {bubbleCount} time bubble{bubbleCount !== 1 ? 's' : ''} for the current day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Warning:</strong> This action cannot be undone. All your scheduled time bubbles for today will be permanently removed.
            </AlertDescription>
          </Alert>

          {bubbleCount === 0 && (
            <Alert>
              <AlertDescription>
                There are no bubbles to delete for the current day.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting || bubbleCount === 0}
            className="min-w-[100px]"
          >
            {isDeleting ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}