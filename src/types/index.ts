import { BUBBLE_COLORS } from "@/lib/constants";
import { DailyInsightsOutputSchema, DailyTipsOutputSchema } from "./ai-types";
import { z } from "zod";

export type BubbleCategory = 'work' | 'study' | 'break' | 'personal' | 'health';

export type BubbleColor = keyof typeof BUBBLE_COLORS;

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
  color: BubbleColor;
  category: BubbleCategory;
  completed: boolean;
  description?: string;
  reflection?: ReflectionData;
  notified?: boolean;
  actionable?: boolean;
  notificationScheduled?: boolean;
}

export interface BubbleTemplate {
  id: string;
  title:string;
  description?: string;
  duration: number;
  color: BubbleColor;
  category: BubbleCategory;
  isDefault?: boolean;
}

export type DailyInsights = z.infer<typeof DailyInsightsOutputSchema>;
export type DailyTips = z.infer<typeof DailyTipsOutputSchema>;
