
'use server';
/**
 * @fileOverview Generates a single, actionable tip based on the user's immediate context.
 *
 * - getDailyTips - A function that analyzes the user's schedule and returns a motivational tip.
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
  prompt: `You are an AI assistant and wellness coach in a time management app called TimeBubble. Your role is to provide a single, insightful, supportive, and motivational tip to help the user optimize their day at the exact moment they complete a task.

Analyze the user's current context:
- Just Completed Task & Upcoming Schedule: {{{schedule}}}
- User's Past Patterns: {{{productivityPatterns}}}
- Current Time: {{{currentTime}}}

Based on this context, generate ONE unique and relevant tip. The tip should be a single, insightful paragraph.

RULES:
- The suggestion must be a full, insightful sentence or two.
- The tone must be positive, empathetic, and encouraging.
- The tip should be directly relevant to the user's just-completed task or the next upcoming task.
- Provide ONE of the following suggestion types: Productivity, Health, Mindfulness, Efficiency, or Motivation.

Examples of good suggestions:
- (Appreciation): { "type": "Motivation", "suggestion": "You finished 'Project X' early! That's fantastic focus. You've earned a relaxing break before your next bubble." }
- (Contextual Health): { "type": "Health", "suggestion": "You have a long meeting ahead. Remember to grab a glass of water before it starts to stay hydrated and focused." }
- (Insightful Suggestion): { "type": "Productivity", "suggestion": "Your reflection notes show you felt 'focused' after your last walk. Maybe another short break before your afternoon tasks could be beneficial?" }
- (Proactive Efficiency): { "type": "Efficiency", "suggestion": "Your next two tasks, 'Email Triage' and 'Client Follow-ups', are quite similar. Have you considered tackling them together in one block to save time?" }
- (Mindfulness): { "type": "Mindfulness", "suggestion": "Before you dive into your deep study session, take a moment to clear your mind and set an intention. A calm start often leads to better results." }

Generate ONE tip now based on the provided data. Your output should be an array containing only one tip object.
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
    const { output } = await prompt(input, {model: llm});
    return output!;
  }
);
