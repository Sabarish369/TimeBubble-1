export interface HabitStack {
  id: string;
  name: string;
  description?: string;
  anchorBubbleId: string; // The bubble this habit is anchored to
  position: 'before' | 'after'; // Whether habit comes before or after anchor
  offsetMinutes: number; // Minutes before/after the anchor bubble
  isActive: boolean;
  createdAt: Date;
  lastCompleted?: Date;
  completionStreak: number;
  totalCompletions: number;
}

export interface HabitTemplate {
  id: string;
  title: string;
  description: string;
  category: 'productivity' | 'wellness' | 'mindfulness' | 'learning' | 'organization';
  estimatedDuration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  icon?: string;
}

export interface HabitStackSuggestion {
  id: string;
  template: HabitTemplate;
  anchorBubbleId: string;
  position: 'before' | 'after';
  offsetMinutes: number;
  reasoning: string;
  confidence: number; // 0-100
}

export interface HabitStackingContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: number; // 0-6
  userEnergyLevel?: 'low' | 'medium' | 'high';
  availableTime: number; // minutes
  existingHabits: HabitStack[];
  recentBubbles: Array<{
    id: string;
    title: string;
    category: string;
    duration: number;
    startTime: Date;
  }>;
}
