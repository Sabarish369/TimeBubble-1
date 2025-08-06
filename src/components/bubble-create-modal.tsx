
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { BUBBLE_COLORS, DEFAULT_BUBBLE_COLOR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { BubbleCategory, BubbleColor } from '@/types';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, setHours, setMinutes, startOfDay } from 'date-fns';
import { Calendar } from './ui/calendar';

interface BubbleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }).max(50),
  description: z.string().max(200).optional(),
  date: z.date(),
  startHour: z.string(),
  startMinute: z.string(),
  endHour: z.string(),
  endMinute: z.string(),
  category: z.enum(['work', 'study', 'break', 'personal', 'health']),
  color: z.string(),
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


type CreateFormValues = z.infer<typeof createSchema>;

const categories: BubbleCategory[] = ['work', 'study', 'break', 'personal', 'health'];
const colorNames = Object.keys(BUBBLE_COLORS) as (keyof typeof BUBBLE_COLORS)[];
const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export function BubbleCreateModal({ isOpen, onClose }: BubbleCreateModalProps) {
  const { addBlockOnDate, currentDate } = useTimeBubbles();
  
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: '',
      description: '',
      date: currentDate,
      startHour: '09',
      startMinute: '00',
      endHour: '10',
      endMinute: '00',
      category: 'personal',
      color: DEFAULT_BUBBLE_COLOR,
    },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset({
            title: '',
            description: '',
            date: currentDate,
            startHour: '09',
            startMinute: '00',
            endHour: '10',
            endMinute: '00',
            category: 'personal',
            color: 'lavender',
        });
    }
  }, [isOpen, currentDate, form]);

  const onSubmit = (data: CreateFormValues) => {
    const newStartTime = setMinutes(setHours(startOfDay(data.date), parseInt(data.startHour)), parseInt(data.startMinute));
    const newEndTime = setMinutes(setHours(startOfDay(data.date), parseInt(data.endHour)), parseInt(data.endMinute));
    
    if (newEndTime <= newStartTime) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }
    
    const newDuration = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);

    const newBlock = {
      title: data.title,
      description: data.description,
      startTime: newStartTime,
      duration: newDuration,
      category: data.category,
      color: data.color as BubbleColor,
    };

    addBlockOnDate(newBlock, data.date);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Bubble</DialogTitle>
          <DialogDescription>
            Add a new time bubble to your schedule on any day.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project Brainstorm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
             />
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add a short description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 p-2 rounded-lg border">
                      {colorNames.map((name) => (
                        <button
                          type="button"
                          key={name}
                          className={cn("w-8 h-8 rounded-full border-2", field.value === name ? "border-ring ring-2 ring-ring" : "border-transparent")}
                          style={{ backgroundColor: `hsl(var(--bubble-${name}))` }}
                          onClick={() => field.onChange(name)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Create Bubble</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
