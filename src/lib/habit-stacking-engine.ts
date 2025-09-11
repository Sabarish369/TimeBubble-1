import type { TimeBlock } from '@/types';
import type { HabitStack, HabitTemplate, HabitStackSuggestion, HabitStackingContext } from '@/types/habit-stacking';
import { HABIT_TEMPLATES, getHabitsByDuration, getEasyHabits } from './habit-templates';

export class HabitStackingEngine {
  private existingHabits: HabitStack[] = [];
  
  constructor(existingHabits: HabitStack[] = []) {
    this.existingHabits = existingHabits;
  }

  /**
   * Generate habit stacking suggestions based on user's routine bubbles
   */
  generateSuggestions(routineBubbles: TimeBlock[], context: HabitStackingContext): HabitStackSuggestion[] {
    const suggestions: HabitStackSuggestion[] = [];
    const usedTemplates = new Set<string>();
    const now = new Date();
    const usedTimeSlots = new Set<string>();
    
    // Sort bubbles by start time to process in chronological order
    const sortedBubbles = [...routineBubbles].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    for (const bubble of sortedBubbles) {
      const bubbleHabits = this.findSuitableHabits(bubble, context);
      
      for (const habit of bubbleHabits) {
        // Avoid duplicate templates
        if (usedTemplates.has(habit.template.id)) continue;
        
        // Check if this habit conflicts with existing habits
        if (this.wouldConflictWithExistingHabits(habit, context.existingHabits)) continue;
        
        // Calculate the proposed habit timing to check if it's in the past
        const habitStartTime = habit.position === 'before'
          ? new Date(bubble.startTime.getTime() - habit.offsetMinutes * 60000)
          : new Date(bubble.startTime.getTime() + bubble.duration * 60000);
        
        // Skip habits that would be scheduled in the past
        if (habitStartTime < now) {
          continue;
        }
        
        // Create a time slot key to prevent overlapping suggestions
        const timeSlotKey = `${habitStartTime.getTime()}-${habit.template.estimatedDuration}`;
        if (usedTimeSlots.has(timeSlotKey)) {
          continue;
        }
        
        suggestions.push(habit);
        usedTemplates.add(habit.template.id);
        usedTimeSlots.add(timeSlotKey);
        
        // Limit suggestions to prevent overwhelming the user
        if (suggestions.length >= 10) break;
      }
      
      if (suggestions.length >= 10) break;
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find suitable habits for a specific bubble
   */
  private findSuitableHabits(bubble: TimeBlock, context: HabitStackingContext): HabitStackSuggestion[] {
    const suggestions: HabitStackSuggestion[] = [];
    const suitableTemplates = this.getSuitableTemplates(bubble, context);
    
    for (const template of suitableTemplates) {
      const suggestion = this.createSuggestion(bubble, template, context);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
    
    return suggestions;
  }

  /**
   * Check if a habit would conflict with existing habits
   */
  private wouldConflictWithExistingHabits(suggestion: HabitStackSuggestion, existingHabits: HabitStack[]): boolean {
    return existingHabits.some(habit => 
      habit.anchorBubbleId === suggestion.anchorBubbleId && 
      habit.position === suggestion.position
    );
  }

  /**
   * Find bubbles that are suitable as anchors for habit stacking
   */
  private findAnchorBubbles(bubbles: TimeBlock[]): TimeBlock[] {
    return bubbles.filter(bubble => {
      // Good anchor bubbles are:
      // 1. Regular routines (not one-off tasks)
      // 2. Have sufficient duration (>15 minutes)
      // 3. Are consistent activities
      const isRoutine = this.isRoutineBubble(bubble);
      const hasSufficientDuration = bubble.duration >= 15;
      const notAlreadyStacked = !this.existingHabits.some(h => h.anchorBubbleId === bubble.id);
      
      return isRoutine && hasSufficientDuration && notAlreadyStacked;
    });
  }

  /**
   * Generate habit suggestions for a specific bubble
   */
  private generateSuggestionsForBubble(
    bubble: TimeBlock,
    context: HabitStackingContext
  ): HabitStackSuggestion[] {
    const suggestions: HabitStackSuggestion[] = [];
    
    // Get suitable habit templates based on context
    const suitableTemplates = this.getSuitableTemplates(bubble, context);
    
    for (const template of suitableTemplates) {
      const suggestion = this.createSuggestion(bubble, template, context);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
    
    return suggestions;
  }

  /**
   * Get habit templates suitable for the given bubble and context
   */
  private getSuitableTemplates(
    bubble: TimeBlock,
    context: HabitStackingContext
  ): HabitTemplate[] {
    let templates = [...HABIT_TEMPLATES];
    
    // Filter by available time (habits should be much shorter than available time)
    const maxDuration = Math.min(context.availableTime / 2, 10);
    templates = getHabitsByDuration(maxDuration);
    
    // Prefer easy habits for beginners
    if (this.existingHabits.length < 3) {
      templates = getEasyHabits();
    }
    
    // Context-based filtering
    templates = templates.filter(template => {
      return this.isTemplateContextuallyAppropriate(template, bubble, context);
    });
    
    // Avoid duplicates with existing habits
    templates = templates.filter(template => {
      return !this.existingHabits.some(habit => 
        habit.name.toLowerCase().includes(template.title.toLowerCase())
      );
    });
    
    return templates.slice(0, 8); // Limit to prevent overwhelming
  }

  /**
   * Check if a template is contextually appropriate
   */
  private isTemplateContextuallyAppropriate(
    template: HabitTemplate,
    bubble: TimeBlock,
    context: HabitStackingContext
  ): boolean {
    // Morning context - prefer energizing habits
    if (context.timeOfDay === 'morning') {
      return ['productivity', 'wellness', 'mindfulness'].includes(template.category);
    }
    
    // Work context - prefer productivity habits
    if (bubble.category === 'work') {
      return ['productivity', 'organization', 'wellness'].includes(template.category);
    }
    
    // Break context - prefer wellness and mindfulness
    if (bubble.category === 'break') {
      return ['wellness', 'mindfulness', 'learning'].includes(template.category);
    }
    
    // Evening context - prefer reflection and organization
    if (context.timeOfDay === 'evening') {
      return ['mindfulness', 'organization', 'learning'].includes(template.category);
    }
    
    return true; // Default to allowing all
  }

  /**
   * Create a habit suggestion for a bubble and template
   */
  private createSuggestion(
    bubble: TimeBlock,
    template: HabitTemplate,
    context: HabitStackingContext
  ): HabitStackSuggestion | null {
    const position = this.determineOptimalPosition(bubble, template, context);
    const offsetMinutes = this.calculateOffset(template, position);
    const confidence = this.calculateConfidence(bubble, template, context);
    const reasoning = this.generateReasoning(bubble, template, position, context);
    
    if (confidence < 30) return null; // Skip low-confidence suggestions
    
    return {
      id: `suggestion-${bubble.id}-${template.id}`,
      template,
      anchorBubbleId: bubble.id,
      position,
      offsetMinutes,
      reasoning,
      confidence
    };
  }

  /**
   * Determine whether habit should come before or after the anchor bubble
   */
  private determineOptimalPosition(
    bubble: TimeBlock,
    template: HabitTemplate,
    context: HabitStackingContext
  ): 'before' | 'after' {
    // Preparation habits go before
    if (template.tags.includes('preparation') || template.tags.includes('planning')) {
      return 'before';
    }
    
    // Reflection habits go after
    if (template.tags.includes('reflection') || template.tags.includes('review')) {
      return 'after';
    }
    
    // Wellness habits often work better before work activities
    if (template.category === 'wellness' && bubble.category === 'work') {
      return 'before';
    }
    
    // Organization habits work well after activities
    if (template.category === 'organization') {
      return 'after';
    }
    
    // Default based on time of day
    return context.timeOfDay === 'morning' ? 'before' : 'after';
  }

  /**
   * Calculate time offset for the habit
   */
  private calculateOffset(template: HabitTemplate, position: 'before' | 'after'): number {
    // Small buffer to ensure smooth transitions
    const buffer = position === 'before' ? 2 : 5;
    return template.estimatedDuration + buffer;
  }

  /**
   * Calculate confidence score for a suggestion
   */
  private calculateConfidence(
    bubble: TimeBlock,
    template: HabitTemplate,
    context: HabitStackingContext
  ): number {
    let confidence = 50; // Base confidence
    
    // Boost for contextual appropriateness
    if (this.isTemplateContextuallyAppropriate(template, bubble, context)) {
      confidence += 20;
    }
    
    // Boost for easy habits
    if (template.difficulty === 'easy') {
      confidence += 15;
    }
    
    // Boost for short habits
    if (template.estimatedDuration <= 3) {
      confidence += 10;
    }
    
    // Boost for routine bubbles
    if (this.isRoutineBubble(bubble)) {
      confidence += 15;
    }
    
    // Reduce for energy mismatch
    if (context.userEnergyLevel === 'low' && template.difficulty === 'hard') {
      confidence -= 20;
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Generate reasoning for why this habit stack makes sense
   */
  private generateReasoning(
    bubble: TimeBlock,
    template: HabitTemplate,
    position: 'before' | 'after',
    context: HabitStackingContext
  ): string {
    const positionText = position === 'before' ? 'before' : 'after';
    const timeContext = this.getTimeContextDescription(context.timeOfDay);
    
    return `Stack "${template.title}" ${positionText} "${bubble.title}" because ${timeContext} ` +
           `This ${template.estimatedDuration}-minute ${template.category} habit will ${template.description.toLowerCase()} ` +
           `and naturally fits with your ${bubble.category} routine.`;
  }

  /**
   * Get description for time context
   */
  private getTimeContextDescription(timeOfDay: string): string {
    switch (timeOfDay) {
      case 'morning':
        return 'mornings are ideal for setting intentions and building momentum.';
      case 'afternoon':
        return 'afternoons benefit from quick resets and energy boosts.';
      case 'evening':
        return 'evenings are perfect for reflection and preparation.';
      default:
        return 'this timing works well with your natural rhythm.';
    }
  }

  /**
   * Check if a bubble represents a routine activity
   */
  private isRoutineBubble(bubble: TimeBlock): boolean {
    // Heuristics to identify routine bubbles
    const routineKeywords = ['morning', 'routine', 'workout', 'meal', 'commute', 'meeting', 'standup'];
    const title = bubble.title.toLowerCase();
    
    return routineKeywords.some(keyword => title.includes(keyword)) ||
           bubble.category === 'break' ||
           bubble.duration >= 30; // Longer activities are often routines
  }

  /**
   * Create a habit stack from a suggestion
   */
  createHabitStack(suggestion: HabitStackSuggestion): HabitStack {
    return {
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: suggestion.template.title,
      description: suggestion.template.description,
      anchorBubbleId: suggestion.anchorBubbleId,
      position: suggestion.position,
      offsetMinutes: suggestion.offsetMinutes,
      isActive: true,
      createdAt: new Date(),
      completionStreak: 0,
      totalCompletions: 0
    };
  }
}
