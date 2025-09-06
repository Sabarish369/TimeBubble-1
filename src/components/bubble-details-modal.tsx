
'use client';

import { useState } from 'react';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Calendar, Clock, Trash2, MessageSquare, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BubbleDetailsModal() {
  const { selectedBlock, setSelectedBlock, setEditingBlock } = useTimeBubbles();
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  
  if (!selectedBlock) return null;

  const handleClose = () => {
    setSelectedBlock(null);
    setShowReflection(false);
    setReflection('');
  };
  
  const handleEdit = () => {
    setEditingBlock(selectedBlock);
    setSelectedBlock(null);
  };

  const handleReschedule = () => {
    // Open edit modal for rescheduling
    setEditingBlock(selectedBlock);
    setSelectedBlock(null);
  };

  const handleDelete = () => {
    // Delete functionality would be implemented here
    console.log('Delete time block:', selectedBlock.id);
    setSelectedBlock(null);
  };

  const handleReflect = () => {
    setShowReflection(true);
  };

  const handleSaveReflection = () => {
    // Here you could save the reflection to the database
    console.log('Reflection saved:', reflection);
    setShowReflection(false);
    setReflection('');
    setSelectedBlock(null);
  };

  const startTime = format(selectedBlock.startTime, 'p');
  const endTime = format(new Date(selectedBlock.startTime.getTime() + selectedBlock.duration * 60000), 'p');
  const isPast = selectedBlock.startTime < new Date();
  const hasReflection = false; // Will be updated when reflection feature is fully implemented
  const isCompleted = hasReflection;
  const needsReflection = isPast && !isCompleted;
  const displayDuration = Math.round(selectedBlock.duration);

  return (
    <Dialog open={!!selectedBlock} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-4 h-4 rounded-full",
              selectedBlock.category === 'work' && "bg-blue-500",
              selectedBlock.category === 'personal' && "bg-green-500",
              selectedBlock.category === 'health' && "bg-red-500",
              selectedBlock.category === 'study' && "bg-purple-500",
              selectedBlock.category === 'break' && "bg-orange-500"
            )} />
            <DialogTitle className="text-xl font-semibold">{selectedBlock.title}</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            {startTime} - {endTime} ({displayDuration} min)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className={cn(
                "capitalize px-3 py-1",
                selectedBlock.category === 'work' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                selectedBlock.category === 'personal' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                selectedBlock.category === 'health' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                selectedBlock.category === 'study' && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                selectedBlock.category === 'break' && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
              )}
            >
              {selectedBlock.category}
            </Badge>
            {isCompleted && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Completed
              </Badge>
            )}
            {needsReflection && (
              <Badge variant="outline" className="text-amber-600 border-amber-600 animate-pulse">
                To Be Reflected
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Description</h4>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                {selectedBlock.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {showReflection && (
            <div className="space-y-3">
              <Label htmlFor="reflection" className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Reflection
              </Label>
              <Textarea
                id="reflection"
                placeholder="How did this time block go? What did you learn or accomplish?"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showReflection ? (
            <>
              <Button variant="outline" onClick={() => setShowReflection(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveReflection} disabled={!reflection.trim()}>
                Save Reflection
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={handleReschedule} className="flex-1 sm:flex-none">
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
                {needsReflection && (
                  <Button 
                    size="sm" 
                    onClick={handleReflect} 
                    className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-lg"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Reflect
                  </Button>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handleEdit} className="flex-1 sm:flex-none">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Time Block</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{selectedBlock.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
