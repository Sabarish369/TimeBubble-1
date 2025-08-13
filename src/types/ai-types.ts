import {z} from 'genkit';

/**
 * @fileOverview Types for AI flows.
 */

// Types for diagnose-plant.ts
export const DiagnosePlantInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the plant.'),
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
});
export type SmartSuggestionsInput = z.infer<typeof SmartSuggestionsInputSchema>;

export const SmartSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggestions to improve the user\'s time planning.'),
});
export type SmartSuggestionsOutput = z.infer<typeof SmartSuggestionsOutputSchema>;

// Types for daily-insights.ts
export const DailyInsightsInputSchema = z.object({
  dailyData: z.string().describe('A JSON string representing the user\'s time blocks for the day. Includes titles, categories, durations, and reflection data (mood, productivity).'),
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
  schedule: z.string().describe("A JSON string of the user's schedule for today. Includes titles, categories, start times, and durations."),
  productivityPatterns: z.string().describe("A summary of the user's historical productivity and mood patterns."),
  currentTime: z.string().describe("The current time in ISO format."),
});
export type DailyTipsInput = z.infer<typeof DailyTipsInputSchema>;

const TipSchema = z.object({
  type: z.enum(["Productivity", "Health", "Mindfulness", "Efficiency", "Motivation"]).describe("The category of the tip."),
  suggestion: z.string().describe("The concise, actionable suggestion. Maximum 12 words."),
});

export const DailyTipsOutputSchema = z.object({
  tips: z.array(TipSchema).describe("An array of 5-7 actionable and motivational tips."),
});
export type DailyTips = z.infer<typeof DailyTipsOutputSchema>;

// Types for daily-sidebar-tip.ts
export const DailySidebarTipInputSchema = z.object({
  date: z.string().describe('The current date in YYYY-MM-DD format.'),
});
export type DailySidebarTipInput = z.infer<typeof DailySidebarTipInputSchema>;

export const DailySidebarTipOutputSchema = z.object({
  tip: z.string().describe('A single, insightful, and inspiring tip for the day.'),
});
export type DailySidebarTip = z.infer<typeof DailySidebarTipOutputSchema>;
