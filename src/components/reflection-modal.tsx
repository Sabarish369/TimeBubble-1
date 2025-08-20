
'use client';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import type { Mood } from '@/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Smile, Meh, Frown, Flame, Coffee, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from './ui/slider';
import { useEffect, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';

const reflectionSchema = z.object({
  productivity: z.number().min(1).max(5),
  mood: z.enum(['happy', 'neutral', 'stressed', 'tired', 'focused']),
  notes: z.string().max(200).optional(),
});

type ReflectionFormValues = z.infer<typeof reflectionSchema>;

const moodOptions: { value: Mood; icon: React.ElementType, label: string }[] = [
  { value: 'happy', icon: Smile, label: 'Happy' },
  { value: 'neutral', icon: Meh, label: 'Neutral' },
  { value: 'stressed', icon: Frown, label: 'Stressed' },
  { value: 'tired', icon: Coffee, label: 'Tired' },
  { value: 'focused', icon: Flame, label: 'Focused' },
];

export function ReflectionModal() {
  const { reflectingBlock, setReflectingBlock, updateBlock } = useTimeBubbles();

  const form = useForm<ReflectionFormValues>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      productivity: 3,
      mood: 'neutral',
      notes: '',
    },
  });

  useEffect(() => {
    if (reflectingBlock) {
      form.reset({
        productivity: reflectingBlock.reflection?.productivity ?? 3,
        mood: reflectingBlock.reflection?.mood ?? 'neutral',
        notes: reflectingBlock.reflection?.notes ?? '',
      });
    }
  }, [reflectingBlock, form]);


  const onSubmit = (data: ReflectionFormValues) => {
    if (!reflectingBlock) return;
    
    // Update the block
    updateBlock(reflectingBlock.id, {
      completed: true,
      reflection: {
        ...data,
        completed: true,
        timestamp: new Date(),
      },
    });
    
    setReflectingBlock(null);
  };

  return (
    <Dialog open={!!reflectingBlock} onOpenChange={() => setReflectingBlock(null)}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>How did "{reflectingBlock?.title}" go?</DialogTitle>
          <DialogDescription>
            Take a moment to reflect. Your insights help improve future planning.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden -mr-6 pr-6">
        <ScrollArea className="h-full pr-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="reflection-form" className="space-y-4">
                <FormField
                control={form.control}
                name="productivity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Productivity: {field.value}</FormLabel>
                    <FormControl>
                        <Slider
                        min={1}
                        max={5}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        />
                    </FormControl>
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mood</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-2 flex-wrap"
                        >
                        {moodOptions.map(({ value, icon: Icon, label }) => (
                            <FormItem key={value} className="flex-1 min-w-[70px]">
                            <FormControl>
                                <RadioGroupItem value={value} className="sr-only" />
                            </FormControl>
                            <FormLabel
                                className={cn(
                                'flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 h-full hover:bg-accent hover:text-accent-foreground cursor-pointer',
                                field.value === value && 'border-primary'
                                )}
                            >
                                <Icon className="mb-1.5 h-6 w-6" />
                                <span className="text-xs">{label}</span>
                            </FormLabel>
                            </FormItem>
                        ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Any thoughts or notes?" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </form>
            </Form>
        </ScrollArea>
        </div>
        <DialogFooter>
            <Button type="submit" form="reflection-form">Save Reflection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
