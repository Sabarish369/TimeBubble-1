
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    delay: number;
  }>>([]);

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
    
    // Generate confetti particles
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      delay: Math.random() * 500,
    }));
    
    setConfettiParticles(particles);
    setShowConfetti(true);
    
    // Update the block
    updateBlock(reflectingBlock.id, {
      completed: true,
      reflection: {
        ...data,
        completed: true,
        timestamp: new Date(),
      },
    });
    
    // Hide confetti and close modal after animation
    setTimeout(() => {
      setShowConfetti(false);
      setTimeout(() => setReflectingBlock(null), 300);
    }, 2000);
  };

  return (
    <Dialog open={!!reflectingBlock} onOpenChange={() => setReflectingBlock(null)}>
      <DialogContent className="relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-lg">
            {confettiParticles.map((particle) => (
              <div
                key={particle.id}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.max(10, Math.min(90, particle.x))}%`,
                  top: `${Math.max(10, Math.min(80, particle.y))}%`,
                  transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
                  animationDelay: `${particle.delay}ms`,
                  animationDuration: '1.5s',
                }}
              >
                <Sparkles 
                  className="w-3 h-3 text-primary animate-pulse" 
                  style={{ animationDuration: '0.8s' }}
                />
              </div>
            ))}
            
            {/* Center celebration burst */}
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-16 h-16 rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-primary animate-spin" style={{ animationDuration: '2s' }} />
                
                {/* Orbiting particles */}
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={`orbit-${i}`}
                    className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-ping"
                    style={{
                      top: `${32 + Math.sin((i * Math.PI) / 2) * 24}px`,
                      left: `${32 + Math.cos((i * Math.PI) / 2) * 24}px`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        <DialogHeader>
          <DialogTitle>How did "{reflectingBlock?.title}" go?</DialogTitle>
          <DialogDescription>
            Take a moment to reflect. Your insights help improve future planning.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden -mr-6 pr-6">
        <ScrollArea className="h-full">
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
                        className="flex gap-2"
                        >
                        {moodOptions.map(({ value, icon: Icon, label }) => (
                            <FormItem key={value} className="flex-1">
                            <FormControl>
                                <RadioGroupItem value={value} className="sr-only" />
                            </FormControl>
                            <FormLabel
                                className={cn(
                                'flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                                field.value === value && 'border-primary'
                                )}
                            >
                                <Icon className="mb-2 h-6 w-6" />
                                {label}
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
