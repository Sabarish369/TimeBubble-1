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
  energyHistory: z.string().describe('JSON string of energy level history'),
  upcomingTasks: z.string().describe('JSON string of planned tasks'),
  currentTime: z.string().describe('Current time of day'),
});

export const EnergyOptimizationOutputSchema = z.object({
  recommendations: z.array(z.object({
    taskId: z.string(),
    suggestedTime: z.string(),
    energyMatch: z.string(),
    reasoning: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
  energyForecast: z.object({
    nextHour: z.number(),
    nextThreeHours: z.number(),
    evening: z.number(),
  }),
});

export type DailySidebarTip = z.infer<typeof DailySidebarTipOutputSchema>;
export type DailySidebarTipInput = z.infer<typeof DailySidebarTipInputSchema>;
export type HabitStackingInput = z.infer<typeof HabitStackingInputSchema>;
export type HabitStackingOutput = z.infer<typeof HabitStackingOutputSchema>;
export type EnergyOptimizationInput = z.infer<typeof EnergyOptimizationInputSchema>;
export type EnergyOptimizationOutput = z.infer<typeof EnergyOptimizationOutputSchema>;