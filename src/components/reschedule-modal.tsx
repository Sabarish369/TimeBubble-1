
'use client';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from './ui/calendar';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, parse, startOfDay } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

// Generate time options for every 15 minutes
const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const totalMinutes = i * 15;
    const date = startOfDay(new Date());
    date.setMinutes(totalMinutes);
    return format(date, 'p');
});

export function RescheduleModal() {
  const { reschedulingBlock, setReschedulingBlock, rescheduleBlock } = useTimeBubbles();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('12:00 PM');
  const { toast } = useToast();

  useEffect(() => {
    if (reschedulingBlock) {
        setSelectedDate(reschedulingBlock.startTime);
        setSelectedTime(format(reschedulingBlock.startTime, 'p'));
    }
  }, [reschedulingBlock]);

  const handleReschedule = () => {
    if (!reschedulingBlock || !selectedDate || !selectedTime) return;
    
    // Prevent rescheduling to the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newStartTime = parse(selectedTime, 'p', selectedDate);
    newStartTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());


    if (newStartTime < new Date()) {
        toast({
            title: 'Invalid Date/Time',
            description: 'Please select a future date and time to reschedule.',
            variant: 'destructive'
        });
        return;
    }
    
    rescheduleBlock(reschedulingBlock.id, newStartTime);
    toast({
        title: 'Bubble Rescheduled',
        description: `"${reschedulingBlock.title}" has been moved to the new date and time.`,
    });
    setReschedulingBlock(null);
  };

  return (
    <Dialog open={!!reschedulingBlock} onOpenChange={() => setReschedulingBlock(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule "{reschedulingBlock?.title}"</DialogTitle>
          <DialogDescription>
            Select a new date and time for this time bubble.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-4">
             <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                className="rounded-md border"
            />
            <div className="space-y-2">
                <Label htmlFor="time-select">Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger id="time-select" className="w-full">
                        <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReschedulingBlock(null)}>Cancel</Button>
          <Button onClick={handleReschedule}>Reschedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
