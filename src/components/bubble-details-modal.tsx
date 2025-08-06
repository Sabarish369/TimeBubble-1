
'use client';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, parse, startOfDay, setHours, setMinutes, getHours, getMinutes } from 'date-fns';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from './ui/form';
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const detailsSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  startHour: z.string(),
  startMinute: z.string(),
  endHour: z.string(),
  endMinute: z.string(),
}).refine(data => {
    const startTime = new Date();
    startTime.setHours(parseInt(data.startHour), parseInt(data.startMinute));
    const endTime = new Date();
    endTime.setHours(parseInt(data.endHour), parseInt(data.endMinute));
    return endTime > startTime;
}, {
    message: "End time must be after start time",
    path: ["endHour"],
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

// Generate time options
const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptions = ['00', '15', '30', '45'];


export function BubbleDetailsModal() {
  const { selectedBlock, setSelectedBlock, updateBlock } = useTimeBubbles();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
  });

  useEffect(() => {
    if (selectedBlock) {
      const endTime = new Date(selectedBlock.startTime.getTime() + selectedBlock.duration * 60000);
      form.reset({
        title: selectedBlock.title,
        description: selectedBlock.description ?? '',
        startHour: getHours(selectedBlock.startTime).toString().padStart(2, '0'),
        startMinute: getMinutes(selectedBlock.startTime).toString().padStart(2, '0'),
        endHour: getHours(endTime).toString().padStart(2, '0'),
        endMinute: getMinutes(endTime).toString().padStart(2, '0'),
      });
    }
  }, [selectedBlock, form, isEditing]);
  
  if (!selectedBlock) return null;

  const handleClose = () => {
    setSelectedBlock(null);
    setIsEditing(false);
    form.reset();
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };

  const onSubmit = (data: DetailsFormValues) => {
    const today = selectedBlock.startTime;
    
    const newStartTime = setMinutes(setHours(startOfDay(today), parseInt(data.startHour)), parseInt(data.startMinute));
    const newEndTime = setMinutes(setHours(startOfDay(today), parseInt(data.endHour)), parseInt(data.endMinute));
    
    // Handle overnight case for end time
    if (newEndTime <= newStartTime) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }
    
    const newDuration = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);

    const updatedData = { 
        title: data.title, 
        description: data.description,
        startTime: newStartTime,
        duration: newDuration,
    };
    
    updateBlock(selectedBlock.id, updatedData);
    setIsEditing(false);
    setSelectedBlock({ ...selectedBlock, ...updatedData });
  };
  
  const startTime = format(selectedBlock.startTime, 'p');
  const endTime = format(new Date(selectedBlock.startTime.getTime() + selectedBlock.duration * 60000), 'p');

  return (
    <Dialog open={!!selectedBlock} onOpenChange={handleClose}>
        <DialogContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        {isEditing ? (
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input {...field} className="text-lg font-semibold" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <DialogTitle>{selectedBlock.title}</DialogTitle>
                        )}
                         <DialogDescription className={cn(isEditing && "hidden")}>
                            {startTime} - {endTime} ({selectedBlock.duration} minutes)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {isEditing && (
                             <div className="grid grid-cols-2 gap-4">
                                <div className='space-y-2'>
                                  <FormLabel>Start Time</FormLabel>
                                  <div className="flex gap-2">
                                      <FormField
                                          control={form.control}
                                          name="startHour"
                                          render={({ field }) => (
                                              <FormItem className='flex-1'>
                                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                      <SelectContent>
                                                          {hourOptions.map(hour => <SelectItem key={`start-hr-${hour}`} value={hour}>{hour}</SelectItem>)}
                                                      </SelectContent>
                                                  </Select>
                                              </FormItem>
                                          )}
                                      />
                                       <FormField
                                          control={form.control}
                                          name="startMinute"
                                          render={({ field }) => (
                                              <FormItem className='flex-1'>
                                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                      <SelectContent>
                                                          {minuteOptions.map(min => <SelectItem key={`start-min-${min}`} value={min}>{min}</SelectItem>)}
                                                      </SelectContent>
                                                  </Select>
                                              </FormItem>
                                          )}
                                      />
                                  </div>
                                   <FormMessage>{form.formState.errors.startTime?.message}</FormMessage>
                                </div>
                                <div className='space-y-2'>
                                    <FormLabel>End Time</FormLabel>
                                    <div className="flex gap-2">
                                        <FormField
                                            control={form.control}
                                            name="endHour"
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {hourOptions.map(hour => <SelectItem key={`end-hr-${hour}`} value={hour}>{hour}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="endMinute"
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {minuteOptions.map(min => <SelectItem key={`end-min-${min}`} value={min}>{min}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormMessage>{form.formState.errors.endHour?.message}</FormMessage>
                                </div>
                            </div>
                        )}
                        <div className='space-y-2'>
                            <h4 className='font-medium'>Category</h4>
                            <Badge variant="secondary" className='capitalize'>{selectedBlock.category}</Badge>
                        </div>
                        <div className='space-y-2'>
                            <h4 className='font-medium'>Description</h4>
                            {isEditing ? (
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea placeholder="Add a short description..." {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <p className='text-sm text-muted-foreground'>
                                    {selectedBlock.description || 'No description provided.'}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        {isEditing ? (
                            <div className="flex justify-end gap-2 w-full">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        ) : (
                            <Button type="button" onClick={handleEdit}>Edit</Button>
                        )}
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
