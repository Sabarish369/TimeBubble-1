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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, AlertTriangle, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import type { TimeBlock } from '@/types';
import { BUBBLE_COLORS } from '@/lib/constants';

interface ConflictNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: TimeBlock[];
  updatedCount: number;
}

export function ConflictNotificationModal({
  isOpen,
  onClose,
  conflicts,
  updatedCount,
}: ConflictNotificationModalProps) {
  const { setCurrentDate } = useTimeBubbles();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleNavigateToConflict = (conflictBubble: TimeBlock) => {
    setNavigatingTo(conflictBubble.id);
    
    // Navigate to the date of the conflict
    const conflictDate = new Date(conflictBubble.startTime);
    setCurrentDate(conflictDate);
    
    // Close the modal after a brief delay to allow navigation
    setTimeout(() => {
      onClose();
      setNavigatingTo(null);
    }, 300);
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      study: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      health: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      break: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Recurring Bubble Sync Results
          </DialogTitle>
          <DialogDescription>
            {updatedCount > 0 && (
              <span className="text-green-600 dark:text-green-400">
                ✓ Successfully updated {updatedCount} future recurring bubbles.
              </span>
            )}
            {conflicts.length > 0 && (
              <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
                ⚠ {conflicts.length} bubbles were moved due to scheduling conflicts.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {conflicts.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Bubbles Moved Due to Conflicts:</h3>
              <p className="text-xs text-muted-foreground">
                These bubbles were automatically rescheduled to avoid overlaps. Click to view each one.
              </p>
            </div>

            <ScrollArea className="h-full max-h-[400px]">
              <div className="space-y-3">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleNavigateToConflict(conflict)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `hsl(var(--bubble-${conflict.color}))` }}
                          />
                          <h4 className="font-medium truncate">{conflict.title}</h4>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getCategoryBadgeColor(conflict.category)}`}
                          >
                            {conflict.category}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(conflict.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatTime(conflict.startTime)} - {' '}
                              {formatTime(new Date(new Date(conflict.startTime).getTime() + conflict.duration * 60000))}
                            </span>
                          </div>
                        </div>

                        {conflict.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {conflict.description}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                        disabled={navigatingTo === conflict.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToConflict(conflict);
                        }}
                      >
                        {navigatingTo === conflict.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {conflicts.length > 0
                ? "Click on any bubble above to navigate to its new time slot"
                : "All recurring bubbles were updated successfully"
              }
            </div>
            <Button onClick={onClose}>Got it</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}