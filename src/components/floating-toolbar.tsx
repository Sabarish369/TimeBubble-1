'use client';

import { useState } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { PasswordPromptModal } from '@/components/password-prompt-modal';

export function FloatingToolbar() {
  const {
    clearAllBlocksWithPassword,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTimeBubbles();
  const isMobile = useIsMobile();
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);

  const handleClearAll = () => {
    setIsPasswordPromptOpen(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    try {
      await clearAllBlocksWithPassword(password);
    } catch (error: any) {
      // Error handling would be done in the password prompt modal
      console.error("Password verification failed", error);
    }
  };

  return (
    <>
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
                <AlertDialogAction onClick={handleClearAll}>
                  Yes, clear all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <PasswordPromptModal
        isOpen={isPasswordPromptOpen}
        onClose={() => setIsPasswordPromptOpen(false)}
        onConfirm={handlePasswordConfirm}
        title="Confirm Clear All"
        description="Please enter your password to confirm clearing all bubbles."
      />
    </>
  );
}