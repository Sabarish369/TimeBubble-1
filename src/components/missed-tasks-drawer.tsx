
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useTimeBubbles, type MissedTaskGroup } from '@/context/time-bubbles-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { History, MessageSquareText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
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
} from './ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface MissedTasksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MissedTasksDrawer({ isOpen, onClose }: MissedTasksDrawerProps) {
  const { 
    getMissedTasks, 
    clearAllMissedTasks, 
    setReflectingBlock, 
    setReschedulingBlock,
    deleteBlockFromDate,
    rescheduleBlock,
  } = useTimeBubbles();

  const [missedTasks, setMissedTasks] = useState<MissedTaskGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMissedTasks = async () => {
      setIsLoading(true);
      const tasks = await getMissedTasks();
      setMissedTasks(tasks);
      setIsLoading(false);
  }

  useEffect(() => {
    if (isOpen) {
      refreshMissedTasks();
    }
  }, [isOpen]);
  
  const handleClearAll = async () => {
    await clearAllMissedTasks();
    setMissedTasks([]);
  };

  const handleDismiss = async (taskId: string, date: string) => {
    await deleteBlockFromDate(taskId, date);
    refreshMissedTasks();
  }
  
  const handleReflect = (task: any) => {
    setReflectingBlock(task);
    onClose();
  };
  
  const handleReschedule = (task: any) => {
    rescheduleBlock(task.id, new Date());
    onClose();
  };


  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Missed Tasks</SheetTitle>
          <SheetDescription>
            Here are all your overdue bubbles. You can reflect, reschedule, or dismiss them.
          </SheetDescription>
        </SheetHeader>
        
        {isLoading ? (
            <div className='space-y-4 py-4'>
                <Skeleton className='h-20 w-full' />
                <Skeleton className='h-20 w-full' />
                <Skeleton className='h-20 w-full' />
            </div>
        ) : missedTasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
                <Alert>
                    <AlertTitle>All caught up!</AlertTitle>
                    <AlertDescription>You have no missed tasks.</AlertDescription>
                </Alert>
            </div>
        ) : (
          <div className={cn("flex-1 overflow-y-auto -mx-6 px-6 divide-y divide-border no-scrollbar")}>
            {missedTasks.map(group => (
              <div key={group.date} className="py-4">
                <h3 className="font-semibold mb-2">{format(new Date(group.date), 'MMMM do, yyyy')}</h3>
                <div className="space-y-2">
                    {group.tasks.map(task => (
                        <div key={task.id} className="p-3 rounded-md border bg-card flex justify-between items-center">
                            <div className="flex-1">
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-muted-foreground">{task.duration} mins</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReflect(task)}>
                                    <MessageSquareText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReschedule(task)}>
                                    <History className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost-destructive" size="icon" className="h-8 w-8" onClick={() => handleDismiss(task.id, group.date)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <SheetFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={missedTasks.length === 0 || isLoading}>
                  <Trash2 className="mr-2 h-4 w-4" /> Clear All Missed
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all of your missed tasks. This action cannot be undone.
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
