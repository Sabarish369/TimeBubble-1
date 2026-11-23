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

// Enhanced Types for daily-tips.ts

// User preferences and personalization
export const UserTipPreferencesSchema = z.object({
  preferredCategories: z.array(z.string()).optional().describe("User's preferred tip categories"),
  tipStyle: z.enum(["concise", "detailed", "motivational", "analytical"]).optional().describe("User's preferred tip style"),
  focusAreas: z.array(z.string()).optional().describe("Areas user wants to focus on improving"),
  avoidTopics: z.array(z.string()).optional().describe("Topics user wants to avoid"),
  timePreference: z.enum(["morning", "evening", "both"]).optional().describe("When user prefers to receive tips"),
});
export type UserTipPreferences = z.infer<typeof UserTipPreferencesSchema>;

// Enhanced input schema with user context
export const DailyTipsInputSchema = z.object({
  schedule: z.string().describe("A JSON string of the user's schedule from the previous day, including completed and incomplete tasks."),
  historicalPatterns: z.string().describe("A comprehensive analysis of the user's historical productivity, mood, and behavioral patterns."),
  userPreferences: z.string().optional().describe("JSON string of user's tip preferences and focus areas."),
  contextualData: z.string().optional().describe("Additional contextual information like weather, calendar events, etc."),
  previousTipsFeedback: z.string().optional().describe("JSON string of feedback on previously provided tips."),
  userGoals: z.string().optional().describe("JSON string of user's current goals and objectives."),
  ...ApiKeySchema,
});
export type DailyTipsInput = z.infer<typeof DailyTipsInputSchema>;

// Extended tip categories and subcategories
const TipCategoryEnum = z.enum([
  "Productivity", "Health", "Mindfulness", "Efficiency", "Motivation",
  "Time Management", "Focus", "Energy", "Habits", "Work-Life Balance",
  "Learning", "Creativity", "Communication", "Planning", "Recovery"
]);

const TipPriorityEnum = z.enum(["low", "medium", "high", "critical"]);
const TipDifficultyEnum = z.enum(["easy", "moderate", "challenging"]);
const TipTimeInvestmentEnum = z.enum(["immediate", "short-term", "long-term"]);

// Enhanced tip schema with metadata
const EnhancedTipSchema = z.object({
  id: z.string().describe("Unique identifier for the tip"),
  type: TipCategoryEnum.describe("The category of the tip"),
  subCategory: z.string().optional().describe("More specific subcategory of the tip"),
  title: z.string().describe("Short, catchy title for the tip"),
  suggestion: z.string().describe("The detailed, actionable suggestion"),
  reasoning: z.string().describe("Why this tip is relevant based on user's data"),
  expectedImpact: z.string().describe("What improvement the user can expect"),
  actionSteps: z.array(z.string()).describe("Specific steps to implement the tip"),
  priority: TipPriorityEnum.describe("Priority level of this tip"),
  difficulty: TipDifficultyEnum.describe("How challenging this tip is to implement"),
  timeInvestment: TipTimeInvestmentEnum.describe("Time horizon for this tip"),
  estimatedDuration: z.string().optional().describe("Estimated time to complete if applicable"),
  relatedGoals: z.array(z.string()).optional().describe("User goals this tip addresses"),
  tags: z.array(z.string()).optional().describe("Searchable tags for the tip"),
  personalizedScore: z.number().min(0).max(100).describe("How personalized this tip is to the user"),
});

// Tip feedback schema
export const TipFeedbackSchema = z.object({
  tipId: z.string().describe("ID of the tip being rated"),
  rating: z.number().min(1).max(5).describe("User rating of the tip (1-5 stars)"),
  helpfulness: z.number().min(1).max(5).describe("How helpful was this tip"),
  implemented: z.boolean().describe("Whether the user implemented the tip"),
  difficulty: z.number().min(1).max(5).describe("How difficult was it to implement"),
  results: z.string().optional().describe("What results the user experienced"),
  feedback: z.string().optional().describe("Additional user feedback"),
  timestamp: z.date().describe("When the feedback was provided"),
});
export type TipFeedback = z.infer<typeof TipFeedbackSchema>;

// Enhanced output schema
export const DailyTipsOutputSchema = z.object({
  tips: z.array(EnhancedTipSchema).min(3).max(10).describe("An array of 3-10 personalized and actionable tips"),
  summary: z.object({
    overallTheme: z.string().describe("The main theme or focus of today's tips"),
    keyInsights: z.array(z.string()).describe("Key insights derived from user's data"),
    priorityFocus: z.string().describe("What the user should prioritize today"),
    encouragement: z.string().describe("Motivational message based on recent performance"),
  }).describe("Summary and context for the tips"),
  analytics: z.object({
    completionRateAnalysis: z.string().describe("Analysis of task completion patterns"),
    productivityTrends: z.string().describe("Identified productivity trends"),
    improvementAreas: z.array(z.string()).describe("Areas with potential for improvement"),
    strengths: z.array(z.string()).describe("User's identified strengths"),
  }).describe("Analytics and insights from user data"),
  metadata: z.object({
    generatedAt: z.string().describe("Timestamp when tips were generated"),
    dataQuality: z.number().min(0).max(100).describe("Quality score of the input data"),
    personalizationLevel: z.number().min(0).max(100).describe("How personalized these tips are"),
    suggestedReviewTime: z.string().describe("When user should review these tips"),
  }).describe("Metadata about the tip generation"),
});
export type DailyTips = z.infer<typeof DailyTipsOutputSchema>;
export type EnhancedTip = z.infer<typeof EnhancedTipSchema>;

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

// Tip analytics and tracking types
export const TipAnalyticsSchema = z.object({
  totalTipsGenerated: z.number().describe("Total number of tips generated for user"),
  implementationRate: z.number().min(0).max(100).describe("Percentage of tips actually implemented"),
  averageRating: z.number().min(0).max(5).describe("Average user rating of tips"),
  categoryPerformance: z.record(z.number()).describe("Performance score by tip category"),
  recentTrends: z.array(z.string()).describe("Recent trends in user's tip engagement"),
  personalizedInsights: z.array(z.string()).describe("Insights about user's tip preferences"),
});
export type TipAnalytics = z.infer<typeof TipAnalyticsSchema>;

// Tip generation context
export const TipGenerationContextSchema = z.object({
  userId: z.string().describe("User identifier"),
  sessionId: z.string().describe("Session identifier for this tip generation"),
  generationReason: z.enum(["scheduled", "manual", "triggered"]).describe("Why tips were generated"),
  userTimezone: z.string().describe("User's timezone"),
  deviceContext: z.string().optional().describe("Device/platform context"),
  environmentalFactors: z.string().optional().describe("Environmental factors like weather, time of day"),
});
export type TipGenerationContext = z.infer<typeof TipGenerationContextSchema>;

// Error tracking for tips
export const TipErrorSchema = z.object({
  errorType: z.enum(["generation", "api", "validation", "network", "unknown"]).describe("Type of error encountered"),
  errorMessage: z.string().describe("Error message"),
  errorContext: z.string().optional().describe("Additional context about the error"),
  retryAttempts: z.number().describe("Number of retry attempts made"),
  timestamp: z.date().describe("When the error occurred"),
  resolved: z.boolean().describe("Whether the error was resolved"),
});
export type TipError = z.infer<typeof TipErrorSchema>;
export type DailySidebarTipInput = z.infer<typeof DailySidebarTipInputSchema>;
export type HabitStackingInput = z.infer<typeof HabitStackingInputSchema>;
export type HabitStackingOutput = z.infer<typeof HabitStackingOutputSchema>;
export type EnergyOptimizationInput = z.infer<typeof EnergyOptimizationInputSchema>;
export type EnergyOptimizationOutput = z.infer<typeof EnergyOptimizationOutputSchema>;
