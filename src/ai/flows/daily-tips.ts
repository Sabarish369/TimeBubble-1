
'use server';
/**
 * @fileOverview Generates a set of daily tips based on the user's previous day's performance.
 *
 * - getDailyTips - A function that analyzes the user's schedule and returns motivational tips.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { DailyTipsInputSchema, DailyTipsOutputSchema, type DailyTips, type DailyTipsInput } from '@/types/ai-types';

export async function getDailyTips(input: DailyTipsInput): Promise<DailyTips> {
  return dailyTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyTipsPrompt',
  input: { schema: DailyTipsInputSchema },
  output: { schema: DailyTipsOutputSchema },
  prompt: `You are an AI assistant and wellness coach in a time management app. Your role is to provide a set of insightful, supportive, and motivational tips to help the user start their day, based on an analysis of their previous day's activities.

Analyze the user's previous day's context:
- Completed & Incomplete Tasks & Schedule: {{{schedule}}}
- User's Mood and Productivity Reflections: {{{productivityPatterns}}}

Based on this context, generate a set of 5-7 unique and relevant tips for the upcoming day. Each tip should be a single, insightful paragraph.

RULES:
- The suggestions must be full, insightful sentences.
- The tone must be positive, empathetic, and encouraging.
- The tips should be directly relevant to the user's logged activities and moods from the previous day.
- Provide a mix of the following suggestion types: Productivity, Health, Mindfulness, Efficiency, or Motivation.

Examples of good suggestions:
- (Reflection on past success): { "type": "Motivation", "suggestion": "You felt 'focused' after your 'Focus Work' bubble yesterday. Let's channel that same energy today!" }
- (Addressing missed tasks): { "type": "Productivity", "suggestion": "It looks like 'Client Follow-ups' was missed yesterday. Maybe tackling that first today could provide a great sense of accomplishment?" }
- (Connecting mood and tasks): { "type": "Health", "suggestion": "You noted feeling 'tired' after your long afternoon block. Remember to schedule a short break today to recharge your batteries." }
- (Efficiency suggestion): { "type": "Efficiency", "suggestion": "You had several similar 'work' tasks back-to-back. Have you considered grouping them into a single, longer focus block to maintain your flow?" }
- (Mindfulness prompt): { "type": "Mindfulness", "suggestion": "Before diving into your first task, take a moment to set an intention for the day. A calm start often leads to better results." }

Generate a set of 5-7 tips now based on the provided data.
`,
});

const dailyTipsFlow = ai.defineFlow(
  {
    name: 'dailyTipsFlow',
    inputSchema: DailyTipsInputSchema,
    outputSchema: DailyTipsOutputSchema,
  },
  async (input) => {
    const llm = googleAI.model('gemini-1.5-flash', {apiKey: input.apiKey});
    try {
        const { output } = await prompt(input, {model: llm});
        return output!;
    } catch (error: any) {
        if (error.status === 400) {
            throw new Error("Invalid API Key. Please check your key in the settings.");
        }
        console.error("Error fetching daily tips:", error);
        throw error;
    }
  }
);
