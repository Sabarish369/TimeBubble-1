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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useTimeBubbles } from '@/context/time-bubbles-context';

interface DeleteAllBubblesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAllBubblesModal({ isOpen, onClose }: DeleteAllBubblesModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { clearAllBlocksAcrossAllDates, timeBlocks } = useTimeBubbles();
  
  const requiredText = 'delete';
  const isConfirmationValid = confirmationText.toLowerCase().trim() === requiredText;
  const bubbleCount = timeBlocks.length;

  const handleDelete = async () => {
    if (!isConfirmationValid) return;
    
    setIsDeleting(true);
    try {
      await clearAllBlocksAcrossAllDates();
      onClose();
      setConfirmationText('');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete All Time
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete all time bubbles across all dates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Warning:</strong> This action cannot be undone. All your scheduled time bubbles across all dates will be permanently removed.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              To confirm, type <span className="font-semibold text-destructive">{requiredText}</span> below:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              disabled={isDeleting}
              className="font-mono"
            />
          </div>

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
            disabled={!isConfirmationValid || isDeleting}
            className="min-w-[100px]"
          >
            {isDeleting ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}