
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

Based on this context, generate 5-7 unique and relevant tips. The tips should be a mix of appreciation for work done and suggestions for upcoming tasks. Each tip should be a single, insightful paragraph.

RULES:
- Each suggestion must be a full, insightful sentence or two.
- The tone must be positive, empathetic, and encouraging.
- Tips should be directly relevant to the user's completed, current, or upcoming tasks.
- Provide a diverse mix of suggestion types: Productivity, Health, Mindfulness, Efficiency, and Motivation.
- Do not repeat tips.

Examples of good suggestions:
- (Appreciation): { "type": "Motivation", "suggestion": "You finished 'Project X' early! That's fantastic focus. You've earned a relaxing break before your next bubble." }
- (Contextual Health): { "type": "Health", "suggestion": "You have a long meeting ahead. Remember to grab a glass of water before it starts to stay hydrated and focused." }
- (Insightful Suggestion): { "type": "Productivity", "suggestion": "Your reflection notes show you felt 'focused' after your last walk. Maybe another short break before your afternoon tasks could be beneficial?" }
- (Proactive Efficiency): { "type": "Efficiency", "suggestion": "Your next two tasks, 'Email Triage' and 'Client Follow-ups', are quite similar. Have you considered tackling them together in one block to save time?" }
- (Mindfulness): { "type": "Mindfulness", "suggestion": "Before you dive into your deep study session, take a moment to clear your mind and set an intention. A calm start often leads to better results." }

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
