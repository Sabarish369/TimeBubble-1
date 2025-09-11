
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
            Build powerful habits by linking them to your existing routines
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Habits Summary */}
          {existingHabits.length > 0 && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Your Active Habit Stacks</h3>
              <div className="flex flex-wrap gap-2">
                {existingHabits.map(habit => (
                  <Badge key={habit.id} variant="secondary" className="text-xs">
                    {habit.name} • {habit.completionStreak} day streak
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Analyzing your routines...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card 
                  key={suggestion.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSuggestions.has(suggestion.id) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() => toggleSuggestion(suggestion.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="text-2xl">{suggestion.template.icon}</span>
                          {suggestion.template.title}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                          >
                            {getConfidenceIcon(suggestion.confidence)}
                            {suggestion.confidence}% match
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm">
                          {suggestion.template.description}
                        </CardDescription>
                      </div>
                      {selectedSuggestions.has(suggestion.id) ? (
                        <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                      ) : (
                        <Plus className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Timing Info */}
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {suggestion.template.estimatedDuration} min
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {suggestion.template.category}
                        </Badge>
                        <Badge 
                          variant={suggestion.position === 'before' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {suggestion.position === 'before' ? '⬅️ Before' : '➡️ After'} routine
                        </Badge>
                      </div>

                      {/* Reasoning */}
                      <div className="bg-muted/50 p-3 rounded text-sm">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-muted-foreground">{suggestion.reasoning}</p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {suggestion.template.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs opacity-70">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && suggestions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No Suitable Routines Found</h3>
              <p className="text-sm mb-4">
                Add some regular routines (like morning routine, workout, or work blocks) to get personalized habit stacking suggestions.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateSuggestions}
              >
                Refresh Suggestions
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {suggestions.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={generateSuggestions}
                  disabled={isLoading}
                >
                  🔄 Refresh
                </Button>
              )}
            </div>
            <Button 
              onClick={handleApplySelected}
              disabled={selectedSuggestions.size === 0 || isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              Create {selectedSuggestions.size} Habit Stack{selectedSuggestions.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
