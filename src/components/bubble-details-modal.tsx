
'use client';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, parse } from 'date-fns';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from './ui/form';
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

const detailsSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  startTime: z.string(),
  endTime: z.string(),
}).refine(data => {
    const start = parse(data.startTime, 'p', new Date());
    const end = parse(data.endTime, 'p', new Date());
    return end > start;
}, {
    message: "End time must be after start time",
    path: ["endTime"],
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

export function BubbleDetailsModal() {
  const { selectedBlock, setSelectedBlock, updateBlock } = useTimeBubbles();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
  });

  useEffect(() => {
    if (selectedBlock) {
      form.reset({
        title: selectedBlock.title,
        description: selectedBlock.description ?? '',
        startTime: format(selectedBlock.startTime, 'p'),
        endTime: format(new Date(selectedBlock.startTime.getTime() + selectedBlock.duration * 60000), 'p'),
      });
    }
  }, [selectedBlock, form]);
  
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
    const newStartTime = parse(data.startTime, 'p', today);
    const newEndTime = parse(data.endTime, 'p', today);
    
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
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Time</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Time</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
