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
  color: string;
  category: BubbleCategory;
  completed: boolean;
  reflection?: ReflectionData;
}
