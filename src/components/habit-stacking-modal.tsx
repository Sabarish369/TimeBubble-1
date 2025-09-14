
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus, Target, Lightbulb, Zap, CheckCircle, X } from 'lucide-react';
import type { TimeBlock } from '@/types';
import type { HabitStack, HabitStackSuggestion, HabitStackingContext } from '@/types/habit-stacking';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { HabitStackingEngine } from '@/lib/habit-stacking-engine';
import { format } from 'date-fns';

interface HabitStackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineBubbles: TimeBlock[];
}

export function HabitStackingModal({ isOpen, onClose, routineBubbles }: HabitStackingModalProps) {
  const [suggestions, setSuggestions] = useState<HabitStackSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [existingHabits, setExistingHabits] = useState<HabitStack[]>([]);
  
  const { addBlock, currentDate, timeBlocks } = useTimeBubbles();

  useEffect(() => {
    if (isOpen && routineBubbles.length > 0) {
      generateSuggestions();
    }
  }, [isOpen, routineBubbles]);

  const generateSuggestions = () => {
    setIsLoading(true);
    
    try {
      // Create context for habit stacking
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      const context: HabitStackingContext = {
        timeOfDay,
        dayOfWeek: now.getDay(),
        availableTime: 15, // Assume 15 minutes available for new habits
        existingHabits,
        recentBubbles: routineBubbles.map(bubble => ({
          id: bubble.id,
          title: bubble.title,
          category: bubble.category,
          duration: bubble.duration,
          startTime: bubble.startTime
        }))
      };

      // Generate suggestions using the engine
      const engine = new HabitStackingEngine(existingHabits);
      const newSuggestions = engine.generateSuggestions(routineBubbles, context);
      
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating habit suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (suggestionId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId);
    } else {
      newSelected.add(suggestionId);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleApplySelected = async () => {
    try {
      const engine = new HabitStackingEngine(existingHabits);
      const now = new Date();
      const createdHabits: HabitStack[] = [];
      const plannedHabits: Array<{
        startTime: Date;
        endTime: Date;
        title: string;
      }> = [];
      
      // First pass: calculate all habit timings and check for conflicts
      const validSuggestions = [];
      
      for (const suggestionId of selectedSuggestions) {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
          console.warn(`Suggestion ${suggestionId} not found`);
          continue;
        }

        // Find the anchor bubble
        const anchorBubble = routineBubbles.find(b => b.id === suggestion.anchorBubbleId);
        if (!anchorBubble) {
          console.warn(`Anchor bubble ${suggestion.anchorBubbleId} not found`);
          continue;
        }

        // Calculate habit timing
        const habitStartTime = suggestion.position === 'before'
          ? new Date(anchorBubble.startTime.getTime() - suggestion.offsetMinutes * 60000)
          : new Date(anchorBubble.startTime.getTime() + anchorBubble.duration * 60000);

        const habitEndTime = new Date(habitStartTime.getTime() + suggestion.template.estimatedDuration * 60000);

        // Skip if the calculated time is in the past
        if (habitStartTime < now) {
          console.warn(`Skipping habit "${suggestion.template.title}" - scheduled time ${habitStartTime.toLocaleTimeString()} is in the past`);
          continue;
        }

        // Check for time conflicts with other planned habits
        const hasConflict = plannedHabits.some(planned => {
          return (habitStartTime < planned.endTime && habitEndTime > planned.startTime);
        });

        if (hasConflict) {
          console.warn(`Skipping habit "${suggestion.template.title}" - time conflict detected`);
          continue;
        }

        // Check for conflicts with existing time blocks
        const conflictsWithExisting = timeBlocks.some((block: TimeBlock) => {
          const blockEndTime = new Date(block.startTime.getTime() + block.duration * 60000);
          return (habitStartTime < blockEndTime && habitEndTime > block.startTime);
        });

        if (conflictsWithExisting) {
          console.warn(`Skipping habit "${suggestion.template.title}" - conflicts with existing time block`);
          continue;
        }

        // Add to planned habits and valid suggestions
        plannedHabits.push({
          startTime: habitStartTime,
          endTime: habitEndTime,
          title: suggestion.template.title
        });

        validSuggestions.push({
          suggestion,
          habitStack: engine.createHabitStack(suggestion),
          habitStartTime,
          anchorBubble
        });
      }

      // Second pass: create all valid habits
      for (const { suggestion, habitStack, habitStartTime, anchorBubble } of validSuggestions) {
        try {
          // Add habit as a time block
          await addBlock({
            title: `${suggestion.template.icon} ${suggestion.template.title}`,
            startTime: habitStartTime,
            duration: suggestion.template.estimatedDuration,
            category: 'personal',
            color: 'canary',
            description: suggestion.template.description,
            actionable: true,
            isHabitStacking: true,
            habitStackingTarget: anchorBubble.id,
            stackBefore: suggestion.position === 'before'
          });

          // Track successfully created habits
          createdHabits.push(habitStack);
          console.log(`Successfully created habit: ${suggestion.template.title} at ${habitStartTime.toLocaleTimeString()}`);
        } catch (blockError) {
          console.error(`Failed to create habit block for "${suggestion.template.title}":`, blockError);
        }
      }

      // Update existing habits with successfully created ones
      if (createdHabits.length > 0) {
        setExistingHabits(prev => [...prev, ...createdHabits]);
        console.log(`Successfully created ${createdHabits.length} out of ${selectedSuggestions.size} selected habit stacks`);
      } else {
        console.warn('No habits were created due to conflicts or validation issues');
      }

      setSelectedSuggestions(new Set());
      onClose();
    } catch (error) {
      console.error('Error applying habit stacks:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <Zap className="h-3 w-3" />;
    if (confidence >= 60) return <CheckCircle className="h-3 w-3" />;
    return <Target className="h-3 w-3" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Smart Habit Stacking
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            This feature will be available very soon! We're working hard to bring you powerful habit stacking capabilities.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Coming Soon Message */}
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8 mb-6">
              <Target className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-3 text-primary">Coming Very Soon!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We're putting the finishing touches on our Smart Habit Stacking feature. 
                It will help you build powerful habits by linking them to your existing routines.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Need help or have questions?
                </p>
                <p className="text-sm font-medium">
                  Contact us: <a href="mailto:timebubblehelp@gmail.com" className="text-primary hover:underline">timebubblehelp@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
