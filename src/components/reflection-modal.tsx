
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
import { Smile, Meh, Frown, Flame, Coffee, Sparkles, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from './ui/slider';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const reflectionSchema = z.object({
  productivity: z.number().min(1).max(5),
  mood: z.enum(['happy', 'neutral', 'stressed', 'tired', 'focused']),
  notes: z.string().max(200).optional(),
});

type ReflectionFormValues = z.infer<typeof reflectionSchema>;

const moodOptions: { value: Mood; icon: React.ElementType, label: string, emoji: string }[] = [
  { value: 'happy', icon: Smile, label: 'Happy', emoji: '😊' },
  { value: 'neutral', icon: Meh, label: 'Neutral', emoji: '😐' },
  { value: 'stressed', icon: Frown, label: 'Stressed', emoji: '😰' },
  { value: 'tired', icon: Coffee, label: 'Tired', emoji: '😴' },
  { value: 'focused', icon: Flame, label: 'Focused', emoji: '🔥' },
];

const productivityLabels = ['Struggled', 'Started', 'Progressed', 'Productive', 'Exceptional'];
const productivityColors = ['bg-red-100 dark:bg-red-900/20', 'bg-orange-100 dark:bg-orange-900/20', 'bg-yellow-100 dark:bg-yellow-900/20', 'bg-green-100 dark:bg-green-900/20', 'bg-blue-100 dark:bg-blue-900/20'];

export function ReflectionModal() {
  const { reflectingBlock, setReflectingBlock, updateBlock } = useTimeBubbles();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const form = useForm<ReflectionFormValues>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      productivity: 3,
      mood: 'neutral',
      notes: '',
    },
  });

  const watchedProductivity = form.watch('productivity');
  const watchedMood = form.watch('mood');

  useEffect(() => {
    if (reflectingBlock) {
      form.reset({
        productivity: reflectingBlock.reflection?.productivity ?? 3,
        mood: reflectingBlock.reflection?.mood ?? 'neutral',
        notes: reflectingBlock.reflection?.notes ?? '',
      });
      setCurrentStep(0);
      setIsSubmitting(false);
      setShowCelebration(false);
    }
  }, [reflectingBlock, form]);


  const onSubmit = async (data: ReflectionFormValues) => {
    if (!reflectingBlock) return;
    
    setIsSubmitting(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update the block
    updateBlock(reflectingBlock.id, {
      completed: true,
      reflection: {
        ...data,
        completed: true,
        timestamp: new Date(),
      },
    });
    
    setShowCelebration(true);
    
    // Close modal after celebration
    setTimeout(() => {
      setReflectingBlock(null);
      setCurrentStep(0);
      setIsSubmitting(false);
      setShowCelebration(false);
    }, 1500);
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
    // Never auto-submit from nextStep - only allow manual submission
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const values = form.getValues();
    switch (currentStep) {
      case 0: return values.productivity >= 1 && values.productivity <= 5;
      case 1: return values.mood !== undefined;
      case 2: return true; // Notes are optional
      default: return false;
    }
  };

  const handleClose = () => {
    setReflectingBlock(null);
    setCurrentStep(0);
    setIsSubmitting(false);
    setShowCelebration(false);
  };

  if (showCelebration) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="mx-auto w-16 h-16 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle2 className="h-8 w-8 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold text-foreground mb-2"
            >
              Reflection Saved
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              Thank you for taking time to reflect
            </motion.p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={!!reflectingBlock} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-xl font-semibold text-foreground">
            How did it go?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            "{reflectingBlock?.title}"
          </DialogDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center space-x-1.5">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  step <= currentStep 
                    ? "bg-primary" 
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </DialogHeader>
        
        <div className="py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="reflection-form" className="h-full">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="productivity"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-medium text-foreground">How productive were you?</h3>
                      <div className={cn(
                        "mx-auto w-20 h-20 rounded-2xl flex items-center justify-center text-3xl transition-colors duration-200",
                        productivityColors[watchedProductivity - 1]
                      )}>
                        {watchedProductivity === 1 && '😔'}
                        {watchedProductivity === 2 && '😐'}
                        {watchedProductivity === 3 && '🙂'}
                        {watchedProductivity === 4 && '😊'}
                        {watchedProductivity === 5 && '🔥'}
                      </div>
                      <p className="text-sm font-medium text-foreground">{productivityLabels[watchedProductivity - 1]}</p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="productivity"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormControl>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>1</span>
                            <span>2</span>
                            <span>3</span>
                            <span>4</span>
                            <span>5</span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
                
                {currentStep === 1 && (
                  <motion.div
                    key="mood"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-medium text-foreground">How did you feel?</h3>
                      <p className="text-sm text-muted-foreground">Select your mood during this task</p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="mood"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-3 gap-3"
                            >
                              {moodOptions.map(({ value, label, emoji }) => (
                                <FormItem key={value}>
                                  <FormControl>
                                    <RadioGroupItem value={value} className="sr-only" />
                                  </FormControl>
                                  <FormLabel
                                    className={cn(
                                      'flex flex-col items-center justify-center rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:bg-accent',
                                      field.value === value 
                                        ? 'border-primary bg-accent' 
                                        : 'border-border'
                                    )}
                                  >
                                    <span className="text-2xl mb-2">{emoji}</span>
                                    <span className="text-xs font-medium text-foreground">{label}</span>
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
                
                {currentStep === 2 && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <div className="text-3xl mb-2">💭</div>
                      <h3 className="text-lg font-medium text-foreground">Any thoughts?</h3>
                      <p className="text-sm text-muted-foreground">Share what you learned (optional)</p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="What went well? What could be improved?"
                              className="min-h-[100px] resize-none"
                              {...field} 
                              value={field.value ?? ''} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>
        </div>
        
        <DialogFooter className="flex justify-between pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          
          {currentStep < 2 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-1.5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => form.handleSubmit(onSubmit)()}
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                  Saving
                </>
              ) : (
                <>
                  Save Reflection
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
