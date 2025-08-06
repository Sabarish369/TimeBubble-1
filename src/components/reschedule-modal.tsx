
'use client';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from './ui/calendar';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function RescheduleModal() {
  const { reschedulingBlock, setReschedulingBlock, rescheduleBlock } = useTimeBubbles();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleReschedule = () => {
    if (!reschedulingBlock || !selectedDate) return;
    
    // Prevent rescheduling to the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
        toast({
            title: 'Invalid Date',
            description: 'Please select a future date to reschedule.',
            variant: 'destructive'
        });
        return;
    }
    
    rescheduleBlock(reschedulingBlock.id, selectedDate);
    toast({
        title: 'Bubble Rescheduled',
        description: `"${reschedulingBlock.title}" has been moved to the new date.`,
    });
    setReschedulingBlock(null);
  };

  return (
    <Dialog open={!!reschedulingBlock} onOpenChange={() => setReschedulingBlock(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule "{reschedulingBlock?.title}"</DialogTitle>
          <DialogDescription>
            Select a new date for this time bubble. It will be moved to the same time on the selected day.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
             <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                className="rounded-md border"
            />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReschedulingBlock(null)}>Cancel</Button>
          <Button onClick={handleReschedule}>Reschedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
