
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus, Target, Lightbulb } from 'lucide-react';
import type { TimeBlock, HabitSuggestion } from '@/types';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { useAuth } from '@/context/auth-context';
import { getHabitStackingSuggestions } from '@/ai/flows/habit-stacking';
import { format } from 'date-fns';

interface HabitStackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineBubbles: TimeBlock[];
}

export function HabitStackingModal({ isOpen, onClose, routineBubbles }: HabitStackingModalProps) {
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const { createTimeBlock, currentDate } = useTimeBubbles();
  const { geminiApiKey } = useAuth();

  useEffect(() => {
    if (isOpen && routineBubbles.length > 0 && geminiApiKey) {
      fetchHabitSuggestions();
    }
  }, [isOpen, routineBubbles, geminiApiKey]);

  const fetchHabitSuggestions = async () => {
    if (!geminiApiKey) return;

    setIsLoading(true);
    try {
      const routineData = routineBubbles.map(b => ({
        id: b.id,
        title: b.title,
        category: b.category,
        startTime: format(b.startTime, 'HH:mm'),
        duration: b.duration
      }));

      const timeOfDay = new Date().getHours() < 12 ? 'morning' : 
                       new Date().getHours() < 17 ? 'afternoon' : 'evening';

      const result = await getHabitStackingSuggestions({
        apiKey: geminiApiKey,
        routineBubbles: JSON.stringify(routineData),
        userHabits: JSON.stringify([]), // Could be populated from user's existing habits
        timeOfDay
      });

      setSuggestions(result.suggestions.map(s => ({
        id: Math.random().toString(36).substr(2, 9),
        habitTitle: s.habitTitle,
        description: s.description,
        estimatedDuration: s.estimatedDuration,
        category: s.category,
        stackBefore: s.stackBefore
      })));
    } catch (error) {
      console.error('Failed to fetch habit suggestions:', error);
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
    for (const suggestionId of selectedSuggestions) {
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) continue;

      const targetBubble = routineBubbles[0]; // For demo, use first routine bubble
      const stackTime = suggestion.stackBefore 
        ? new Date(targetBubble.startTime.getTime() - suggestion.estimatedDuration * 60000)
        : new Date(targetBubble.startTime.getTime() + targetBubble.duration * 60000);

      await createTimeBlock({
        title: suggestion.habitTitle,
        startTime: stackTime,
        duration: suggestion.estimatedDuration,
        category: suggestion.category,
        color: 'blue',
        description: suggestion.description,
        actionable: true
      });
    }

    setSelectedSuggestions(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Habit Stacking Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Stack small, achievable habits with your existing routines to build lasting positive changes.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Analyzing your routines...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <Card 
                  key={suggestion.id}
                  className={`cursor-pointer transition-all ${
                    selectedSuggestions.has(suggestion.id) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleSuggestion(suggestion.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          {suggestion.habitTitle}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {suggestion.description}
                        </CardDescription>
                      </div>
                      {selectedSuggestions.has(suggestion.id) && (
                        <div className="ml-2">
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {suggestion.estimatedDuration} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                      <Badge variant={suggestion.stackBefore ? 'default' : 'secondary'} className="text-xs">
                        {suggestion.stackBefore ? 'Before routine' : 'After routine'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && suggestions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No habit suggestions found for your current routines.</p>
              <p className="text-sm">Try adding more routine bubbles to get personalized suggestions.</p>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplySelected}
              disabled={selectedSuggestions.size === 0 || isLoading}
            >
              Add Selected Habits ({selectedSuggestions.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
