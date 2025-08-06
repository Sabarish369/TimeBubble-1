import { BUBBLE_COLORS } from "@/lib/constants";

export type BubbleCategory = 'work' | 'study' | 'break' | 'personal' | 'health';

export type Mood = 'happy' | 'neutral' | 'stressed' | 'tired' | 'focused';

export interface ReflectionData {
  completed: boolean;
  productivity: 1 | 2 | 3 | 4 | 5;
  mood: Mood;
  notes: string;
  timestamp: Date;
}

export interface TimeBlock {
  id: string;
  title: string;
  startTime: Date;
  duration: number; // in minutes
  color: keyof typeof BUBBLE_COLORS;
  category: BubbleCategory;
  completed: boolean;
  reflection?: ReflectionData;
}

export interface BubbleTemplate {
  id: string;
  title: string;
  duration: number;
  color: keyof typeof BUBBLE_COLORS;
  category: BubbleCategory;
  isDefault?: boolean;
}
