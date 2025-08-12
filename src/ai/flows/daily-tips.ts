
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
  prompt: `You are an AI assistant in a time management app called TimeBubble. Your role is to provide short, actionable, and motivational tips to help the user optimize their day.

Analyze the user's current context:
- Today's Schedule: {{{schedule}}}
- User's Past Patterns: {{{productivityPatterns}}}
- Current Time: {{{currentTime}}}

Based on this context, generate 5-7 unique and relevant tips.

RULES:
- Each suggestion must be concise (max 12 words).
- The tone must be positive and encouraging.
- Tips should be directly relevant to the user's current or upcoming tasks.
- Provide a diverse mix of suggestion types: Productivity, Health, Mindfulness, Efficiency, and Motivation.
- Do not repeat tips.

Examples:
- If a "Study Session" is next: { "type": "Productivity", "suggestion": "Start your study session with a 5-minute warm-up read." }
- If the user is in a long "Focus Work" bubble: { "type": "Health", "suggestion": "Stretch for 2 minutes after this current bubble ends." }
- If a "Meeting" bubble is coming up: { "type": "Mindfulness", "suggestion": "Take 3 deep breaths before your next meeting starts." }
- If there are two 'email' tasks: { "type": "Efficiency", "suggestion": "Batch replying to all your emails in one go." }
- If the user is on schedule: { "type": "Motivation", "suggestion": "You are on track to have a great day!" }

Generate the tips now.
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
