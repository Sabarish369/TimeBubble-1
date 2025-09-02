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
import { BUBBLE_COLORS, FREE_COLOR_NAMES, PRO_COLOR_NAMES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { BubbleCategory, BubbleColor } from '@/types';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Lock, Repeat } from 'lucide-react';
import { format, setHours, setMinutes, startOfDay, getHours, getMinutes, addDays, isSameDay } from 'date-fns';
import { Calendar } from './ui/calendar';
import { useAuth } from '@/context/auth-context';
import { ProModal } from './pro-modal';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { DeleteAllBubblesModal } from './delete-all-bubbles-modal';

const editSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }).max(50),
  description: z.string().max(200).optional(),
  date: z.date(),
  startHour: z.string(),
  startMinute: z.string(),
  endHour: z.string(),
  endMinute: z.string(),
  category: z.enum(['work', 'study', 'break', 'personal', 'health']),
  color: z.string(),
  isRecurring: z.boolean().default(false),
  selectedDays: z.array(z.number()).default([]),
  endDate: z.date().optional(),
}).refine(data => {
    const startTime = new Date();
    startTime.setHours(parseInt(data.startHour), parseInt(data.startMinute));
    const endTime = new Date();
    endTime.setHours(parseInt(data.endHour), parseInt(data.endMinute));
    return endTime > startTime;
}, {
    message: "End time must be after start time",
    path: ["endHour"],
}).refine(data => {
    if (data.isRecurring && data.selectedDays.length === 0) {
        return false;
    }
    return true;
}, {
    message: "Please select at least one day for recurring bubbles",
    path: ["selectedDays"],
});

type EditFormValues = z.infer<typeof editSchema>;

const categories: BubbleCategory[] = ['work', 'study', 'break', 'personal', 'health'];
const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function BubbleEditModal() {
  const { editingBlock, setEditingBlock, updateBlock, addBlockOnDate, deleteBlock } = useTimeBubbles();
  const { isPro } = useAuth();
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
      startHour: '09',
      startMinute: '00',
      endHour: '10',
      endMinute: '00',
      category: 'personal',
      color: 'lavender',
      isRecurring: false,
      selectedDays: [],
      endDate: undefined,
    },
  });

  useEffect(() => {
    if (editingBlock) {
      const endTime = new Date(editingBlock.startTime.getTime() + editingBlock.duration * 60000);
      
      form.reset({
        title: editingBlock.title,
        description: editingBlock.description || '',
        date: editingBlock.startTime,
        startHour: getHours(editingBlock.startTime).toString().padStart(2, '0'),
        startMinute: getMinutes(editingBlock.startTime).toString().padStart(2, '0'),
        endHour: getHours(endTime).toString().padStart(2, '0'),
        endMinute: getMinutes(endTime).toString().padStart(2, '0'),
        category: editingBlock.category,
        color: editingBlock.color,
        isRecurring: false, // Default to false for existing blocks
        selectedDays: [],
        endDate: undefined,
      });
    }
  }, [editingBlock, form]);

  const onSubmit = (data: EditFormValues) => {
    if (!editingBlock) return;

    const newStartTime = setMinutes(setHours(startOfDay(data.date), parseInt(data.startHour)), parseInt(data.startMinute));
    const newEndTime = setMinutes(setHours(startOfDay(data.date), parseInt(data.endHour)), parseInt(data.endMinute));
    
    if (newEndTime <= newStartTime) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }
    
    const newDuration = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);

    if (data.isRecurring && data.selectedDays.length > 0) {
      // Handle recurring bubbles
      const startDate = data.date;
      const endDate = data.endDate || addDays(startDate, 90); // Default to 90 days if no end date
      
      // First, delete the original block
      deleteBlock(editingBlock.id);
      
      // Then create recurring bubbles
      let currentDate = startDate;
      let createdCount = 0;
      
      while (currentDate <= endDate && createdCount < 365) { // Safety limit
        const dayOfWeek = currentDate.getDay();
        
        if (data.selectedDays.includes(dayOfWeek)) {
          const blockStartTime = setMinutes(
            setHours(startOfDay(currentDate), parseInt(data.startHour)), 
            parseInt(data.startMinute)
          );
          
          const blockToCreate = {
            title: data.title,
            description: data.description,
            startTime: blockStartTime,
            duration: newDuration,
            category: data.category,
            color: data.color as BubbleColor,
          };
          
          addBlockOnDate(blockToCreate, currentDate);
          createdCount++;
        }
        
        currentDate = addDays(currentDate, 1);
      }
    } else {
      // Update single bubble
      const updatedData = {
        title: data.title,
        description: data.description,
        startTime: newStartTime,
        duration: newDuration,
        category: data.category,
        color: data.color as BubbleColor,
      };

      updateBlock(editingBlock.id, updatedData);
    }
    
    setEditingBlock(null);
  };

  const handleClose = () => {
    setEditingBlock(null);
  };

  const handleColorSelect = (colorName: string, fieldOnChange: (value: string) => void) => {
    if (PRO_COLOR_NAMES.includes(colorName as any) && !isPro) {
      setIsProModalOpen(true);
    } else {
      fieldOnChange(colorName);
    }
  };

  if (!editingBlock) return null;

  return (
    <>
      <Dialog open={!!editingBlock} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit Bubble</DialogTitle>
            <DialogDescription>
              Modify your time bubble details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <Form {...form}>
              <form id="bubble-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
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
                        <div className="p-2 rounded-lg border">
                          <div className="text-xs text-muted-foreground mb-2">Free Colors</div>
                          <div className="flex flex-wrap gap-2">
                            {FREE_COLOR_NAMES.map((name) => (
                              <button
                                type="button"
                                key={name}
                                className={cn("w-8 h-8 rounded-full border-2", field.value === name ? "border-ring ring-2 ring-ring" : "border-transparent")}
                                style={{ backgroundColor: `hsl(var(--bubble-${name}))` }}
                                onClick={() => handleColorSelect(name, field.onChange)}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mt-3 mb-2">Pro Colors</div>
                          <div className="flex flex-wrap gap-2">
                            {PRO_COLOR_NAMES.map((name) => (
                              <button
                                type="button"
                                key={name}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 relative group", 
                                  field.value === name ? "border-ring ring-2 ring-ring" : "border-transparent",
                                  !isPro && "opacity-60"
                                )}
                                style={{ backgroundColor: `hsl(var(--bubble-${name}))` }}
                                onClick={() => handleColorSelect(name, field.onChange)}
                              >
                                {!isPro && <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white opacity-70" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Recurring Options */}
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Repeat className="h-4 w-4" />
                          Make this a recurring bubble
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Repeat this bubble on selected days of the week
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Day Selection - only show when recurring is enabled */}
                {form.watch('isRecurring') && (
                  <>
                    <FormField
                      control={form.control}
                      name="selectedDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Days</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-7 gap-2">
                              {dayNames.map((day, index) => {
                                const isSelected = field.value.includes(index);
                                return (
                                  <div key={index} className="flex flex-col items-center space-y-1">
                                    <Checkbox
                                      id={`day-${index}`}
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, index]);
                                        } else {
                                          field.onChange(field.value.filter((d: number) => d !== index));
                                        }
                                      }}
                                      className="sr-only"
                                    />
                                    <label
                                      htmlFor={`day-${index}`}
                                      className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-colors",
                                        isSelected
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                      )}
                                    >
                                      {day}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date (Optional)</FormLabel>
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
                                    <span>Select end date (default: 90 days)</span>
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
                                disabled={(date) => date < form.getValues('date')}
                              />
                            </PopoverContent>
                          </Popover>
                          <div className="text-xs text-muted-foreground">
                            Leave empty to create bubbles for the next 90 days
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </form>
            </Form>
          </div>
          
          <DialogFooter className="shrink-0 border-t pt-4 flex flex-col sm:flex-row gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit" form="bubble-edit-form">
                  {form.watch('isRecurring') ? 'Create Recurring Bubbles' : 'Save Changes'}
                </Button>
              </div>
              <div className="flex gap-2 sm:ml-auto">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="text-xs"
                >
                  Delete All Bubbles
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
      <DeleteAllBubblesModal 
        isOpen={isDeleteAllModalOpen} 
        onClose={() => setIsDeleteAllModalOpen(false)} 
      />
    </>
  );
}