
'use client';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from './ui/calendar';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, parse, startOfDay, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export function RescheduleModal() {
  const { reschedulingBlock, setReschedulingBlock, rescheduleBlock } = useTimeBubbles();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedHour, setSelectedHour] = useState<string>('12');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const { toast } = useToast();

  useEffect(() => {
    if (reschedulingBlock) {
        const startTime = reschedulingBlock.startTime;
        setSelectedDate(startTime);
        setSelectedHour(getHours(startTime).toString().padStart(2, '0'));
        setSelectedMinute(getMinutes(startTime).toString().padStart(2, '0'));
    }
  }, [reschedulingBlock]);

  const handleReschedule = () => {
    if (!reschedulingBlock || !selectedDate) return;
    
    let newStartTime = setMinutes(setHours(startOfDay(selectedDate), parseInt(selectedHour)), parseInt(selectedMinute));

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
            <div className="space-y-2 flex-1">
                <Label>Time</Label>
                <div className="flex gap-2">
                    <Select value={selectedHour} onValueChange={setSelectedHour}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                            {hourOptions.map(hour => (
                                <SelectItem key={`hr-${hour}`} value={hour}>{hour}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                            {minuteOptions.map(minute => (
                                <SelectItem key={`min-${minute}`} value={minute}>{minute}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
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
