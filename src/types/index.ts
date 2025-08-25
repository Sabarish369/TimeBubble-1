
import { BUBBLE_COLORS } from "@/lib/constants";
import { DailyInsightsOutputSchema, DailySidebarTipOutputSchema, DailyTipsOutputSchema, DailySidebarTipInputSchema } from "./ai-types";
import { z } from "zod";

export type BubbleCategory = 'work' | 'study' | 'break' | 'personal' | 'health';

export type BubbleColor = keyof typeof BUBBLE_COLORS;

export type Mood = 'happy' | 'neutral' | 'stressed' | 'tired' | 'focused';

export interface HabitSuggestion {
  id: string;
  habitTitle: string;
  description: string;
  estimatedDuration: number; // in minutes
  category: BubbleCategory;
  stackBefore?: boolean; // true = before the bubble, false = after
}

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
  habitSuggestions?: HabitSuggestion[];
  energyOptimal?: boolean; // true if scheduled at optimal energy time
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

export type Theme = 'light' | 'dark';

export interface UserPreferences {
  theme?: Theme;
  geminiApiKey?: string;
}

export interface TimeBubble {
    id: string;
    title: string;
    startTime: Date;
    duration: number; // in minutes
    color: BubbleColor;
    category: BubbleCategory;
    completed: boolean;
    description?: string;
    reflection?: ReflectionData;
}


export interface EnergyTracking {
    morning: EnergyLevel;
    afternoon: EnergyLevel;
    evening: EnergyLevel;
}

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;


export type DailyInsights = z.infer<typeof DailyInsightsOutputSchema>;
export type DailyTips = z.infer<typeof DailyTipsOutputSchema>;
export type DailySidebarTip = z.infer<typeof DailySidebarTipOutputSchema>;
export type DailySidebarTipInput = z.infer<typeof DailySidebarTipInputSchema>;

// Weekly Analysis Types
export interface ProgressData {
  date: string;
  completionRate: number;
  productivityScore: number;
  moodScore: number;
  workHours: number;
  personalHours: number;
  consistencyScore: number;
  balanceScore: number;
}

export type InsightImpact = 'positive' | 'negative' | 'neutral';
export type InsightType = 'productivity' | 'consistency' | 'balance' | 'improvement' | 'achievement';

export interface WeeklyInsight {
  title: string;
  description: string;
  type: InsightType;
  impact: InsightImpact;
  metric?: number;
  previousWeek?: number;
}

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface WeeklyRecommendation {
  title: string;
  description: string;
  priority: RecommendationPriority;
  expectedImpact: number;
  actionable: boolean;
}

export type TrendDirection = 'up' | 'down' | 'stable';
export type TrendSignificance = 'high' | 'medium' | 'low';

export interface WeeklyTrend {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  direction: TrendDirection;
  significance: TrendSignificance;
}

export interface WeeklyAnalysis {
  overallScore: number;
  completionRate: number;
  productivityScore: number;
  consistencyScore: number;
  balanceScore: number;
  totalWorkHours: number;
  totalPersonalHours: number;
  totalBreakHours: number;
  totalStudyHours: number;
  insights: WeeklyInsight[];
  recommendations: WeeklyRecommendation[];
  trends: WeeklyTrend[];
}
