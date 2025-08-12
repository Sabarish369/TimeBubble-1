
'use server';
/**
 * @fileOverview Generates short, actionable tips to help the user optimize their day.
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
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: DailyTipsInputSchema },
  output: { schema: DailyTipsOutputSchema },
  prompt: `You are an AI assistant and wellness coach in a time management app called TimeBubble. Your role is to provide insightful, supportive, and motivational tips to help the user optimize their day.

Analyze the user's current context:
- Today's Schedule & Completed Tasks: {{{schedule}}}
- User's Past Patterns: {{{productivityPatterns}}}
- Current Time: {{{currentTime}}}

Based on this context, generate 5-7 unique and relevant tips. The tips should be a mix of appreciation for work done and suggestions for upcoming tasks.

RULES:
- Each suggestion must be concise (max 20 words).
- The tone must be positive, empathetic, and encouraging.
- Tips should be directly relevant to the user's completed, current, or upcoming tasks.
- Provide a diverse mix of suggestion types: Productivity, Health, Mindfulness, Efficiency, and Motivation.
- Do not repeat tips.

Examples of good suggestions:
- (Appreciation): { "type": "Motivation", "suggestion": "You finished 'Project X' early! Great focus today." }
- (Contextual Health): { "type": "Health", "suggestion": "Long meeting ahead. Grab a glass of water before it starts." }
- (Insightful Suggestion): { "type": "Productivity", "suggestion": "You felt 'focused' after your last break. Another short one soon?" }
- (Proactive Efficiency): { "type": "Efficiency", "suggestion": "Your next two tasks are similar. Try to tackle them together." }
- (Mindfulness): { "type": "Mindfulness", "suggestion": "Before your study session, take a moment to clear your mind." }

Generate the tips now based on the provided data.
`,
});

const dailyTipsFlow = ai.defineFlow(
  {
    name: 'dailyTipsFlow',
    inputSchema: DailyTipsInputSchema,
    outputSchema: DailyTipsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
