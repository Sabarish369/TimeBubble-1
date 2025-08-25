import {z} from 'genkit';

/**
 * @fileOverview Types for AI flows.
 */

const ApiKeySchema = {
    apiKey: z.string().optional().describe("A Google AI API key.")
};

// Types for diagnose-plant.ts
export const DiagnosePlantInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the plant.'),
  ...ApiKeySchema,
});
export type DiagnosePlantInput = z.infer<typeof DiagnosePlantInputSchema>;

export const DiagnosePlantOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Whether or not the input is a plant.'),
    commonName: z.string().describe('The name of the identified plant.'),
    latinName: z.string().describe('The Latin name of the identified plant.'),
  }),
  diagnosis: z.object({
    isHealthy: z.boolean().describe('Whether or not the plant is healthy.'),
    diagnosis: z.string().describe("The diagnosis of the plant's health."),
  }),
});
export type DiagnosePlantOutput = z.infer<typeof DiagnosePlantOutputSchema>;


// Types for smart-suggestions.ts
export const SmartSuggestionsInputSchema = z.object({
  dailyData: z.string().describe('JSON string of the user\'s daily time block data, each block should include the id, title, startTime, duration, color, category, position, completed, and reflection.'),
  userPreferences: z.string().describe('JSON string of the user\'s preferences including theme and working hours.'),
  ...ApiKeySchema,
});
export type SmartSuggestionsInput = z.infer<typeof SmartSuggestionsInputSchema>;

export const SmartSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggestions to improve the user\'s time planning.'),
});
export type SmartSuggestionsOutput = z.infer<typeof SmartSuggestionsOutputSchema>;

// Types for daily-insights.ts
export const DailyInsightsInputSchema = z.object({
  dailyData: z.string().describe('A JSON string representing the user\'s time blocks for the day. Includes titles, categories, durations, and reflection data (mood, productivity).'),
  ...ApiKeySchema,
});
export type DailyInsightsInput = z.infer<typeof DailyInsightsInputSchema>;

export const DailyInsightsOutputSchema = z.object({
  title: z.string().describe("A creative and fitting title for the day, like 'A Productive Wednesday' or 'A Focus-Filled Friday'."),
  summary: z.string().describe("A brief, engaging summary of the user's day, highlighting key activities and achievements."),
  productivityInsight: z.string().describe("An insight into the user's productivity patterns, e.g., 'Your productivity scores are 23% higher on days when you start with exercise'."),
  moodInsight: z.string().describe("An observation about the user's mood correlations, e.g., 'You felt most focused during your 'Deep Work' blocks this week'."),
  recommendation: z.string().describe("An actionable recommendation for future planning, e.g., 'Consider scheduling creative tasks between 2-4 PM when your mood is typically highest'."),
});
export type DailyInsights = z.infer<typeof DailyInsightsOutputSchema>;

// Types for daily-tips.ts
export const DailyTipsInputSchema = z.object({
  schedule: z.string().describe("A JSON string of the user's schedule from the previous day, including completed and incomplete tasks."),
  productivityPatterns: z.string().describe("A summary of the user's historical productivity and mood patterns from their reflections."),
  ...ApiKeySchema,
});
export type DailyTipsInput = z.infer<typeof DailyTipsInputSchema>;

const TipSchema = z.object({
  type: z.enum(["Productivity", "Health", "Mindfulness", "Efficiency", "Motivation"]).describe("The category of the tip."),
  suggestion: z.string().describe("The concise, actionable suggestion."),
});

export const DailyTipsOutputSchema = z.object({
  tips: z.array(TipSchema).describe("An array of 5-7 actionable and motivational tips based on the previous day's performance."),
});
export type DailyTips = z.infer<typeof DailyTipsOutputSchema>;

// Types for daily-sidebar-tip.ts
export const DailySidebarTipInputSchema = z.object({
  scheduleData: z.string().describe('JSON string of the user\'s schedule data for the day'),
  ...ApiKeySchema,
});

export const DailySidebarTipOutputSchema = z.object({
  tip: z.string().describe('A short, inspiring tip for the day'),
});

// Habit Stacking AI Types
export const HabitStackingInputSchema = z.object({
  apiKey: z.string(),
  routineBubbles: z.string().describe('JSON string of routine bubbles'),
  userHabits: z.string().describe('JSON string of existing user habits'),
  timeOfDay: z.string().describe('Morning, afternoon, or evening'),
});

export const HabitStackingOutputSchema = z.object({
  suggestions: z.array(z.object({
    habitTitle: z.string(),
    description: z.string(),
    estimatedDuration: z.number(),
    category: z.enum(['work', 'study', 'break', 'personal', 'health']),
    stackBefore: z.boolean(),
    targetBubbleId: z.string(),
    reasoning: z.string(),
  })),
});

// Energy Level AI Types
export const EnergyOptimizationInputSchema = z.object({
  apiKey: z.string(),
  dailyData: z.string().describe("JSON string of the user's completed tasks for the day, including reflection data (mood, productivity)."),
  upcomingTasks: z.string().describe('JSON string of planned, incomplete tasks for the day.'),
  currentTime: z.string().describe('Current time of day, e.g., "14:30".'),
});

export const EnergyOptimizationOutputSchema = z.object({
  recommendations: z.array(z.object({
    taskId: z.string().describe("The title of the upcoming task to be rescheduled."),
    suggestedTime: z.string().describe("The suggested optimal start time for the task, e.g., '3:00 PM'."),
    reasoning: z.string().describe("Explanation for why this time is suggested based on inferred energy levels."),
    priority: z.enum(['high', 'medium', 'low']).describe("The priority of the recommendation."),
  })),
  energyForecast: z.object({
    nextHour: z.number().describe("Predicted energy level (1-5) for the next hour."),
    nextThreeHours: z.number().describe("Predicted energy level (1-5) for the next three hours."),
    evening: z.number().describe("Predicted energy level (1-5) for the evening."),
  }),
});

export type DailySidebarTip = z.infer<typeof DailySidebarTipOutputSchema>;
export type DailySidebarTipInput = z.infer<typeof DailySidebarTipInputSchema>;
export type HabitStackingInput = z.infer<typeof HabitStackingInputSchema>;
export type HabitStackingOutput = z.infer<typeof HabitStackingOutputSchema>;
export type EnergyOptimizationInput = z.infer<typeof EnergyOptimizationInputSchema>;
export type EnergyOptimizationOutput = z.infer<typeof EnergyOptimizationOutputSchema>;

// Weekly Analysis Types
export const WeeklyAnalysisInputSchema = z.object({
  apiKey: z.string(),
  weeklyData: z.string().describe(
    "JSON string of the last 7 days. Shape: [{ date: 'YYYY-MM-DD', blocks: [{ id, title, category, duration, startTime, completed, reflection?{ mood, productivity, notes } }] }]"
  ),
  computedMetrics: z
    .string()
    .optional()
    .describe(
      "Optional JSON with precomputed metrics (totals, completion rates, averages) to improve accuracy."
    ),
  weekRangeLabel: z
    .string()
    .optional()
    .describe("Optional human-readable range label, e.g., 'Mar 3–Mar 9'."),
});

const CategoryBreakdownSchema = z.object({
  category: z.enum(['work', 'study', 'break', 'personal', 'health']).describe('Bubble category'),
  minutes: z.number().describe('Total scheduled minutes'),
  completed: z.number().describe('Completed bubbles count'),
  completionRate: z.number().describe('0-1 completion rate for this category'),
});

export const WeeklyAnalysisOutputSchema = z.object({
  summary: z.string().describe('High-level weekly narrative with concrete observations.'),
  kpis: z.object({
    totalBubbles: z.number(),
    completedBubbles: z.number(),
    completionRate: z.number().describe('0-1 overall completion rate'),
    totalMinutes: z.number().describe('Total scheduled minutes'),
    totalCompletedMinutes: z.number().describe('Total completed minutes'),
    avgProductivity: z.number().describe('1-5 average for completed reflections'),
    dominantMood: z.enum(['happy', 'neutral', 'stressed', 'tired', 'focused']).describe('Most frequent mood among reflections'),
    categoryBreakdown: z.array(CategoryBreakdownSchema),
  }),
  bestFocusWindows: z.array(z.string()).describe('Time-of-day windows like "09:00–11:00" derived from reflections.'),
  topWins: z.array(z.string()).describe('Top 3-5 achievements phrased concretely.'),
  bottlenecks: z.array(z.string()).describe('Top 3-5 obstacles with likely causes.'),
  recommendations: z.array(z.string()).describe('Actionable improvements, specific and testable.'),
  nextWeekPlan: z
    .array(
      z.object({
        goal: z.string(),
        rationale: z.string(),
      })
    )
    .describe('Three prioritized goals for next week.'),
  daySummaries: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      highlight: z.string(),
    })
  ).describe('One-line highlight per day'),
});

export type WeeklyAnalysisInput = z.infer<typeof WeeklyAnalysisInputSchema>;
export type WeeklyAnalysisOutput = z.infer<typeof WeeklyAnalysisOutputSchema>;
