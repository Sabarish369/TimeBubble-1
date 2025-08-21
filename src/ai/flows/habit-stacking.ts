
'use server';
/**
 * @fileOverview AI flow for generating habit stacking suggestions.
 *
 * - getHabitStackingSuggestions - Suggests small habits to stack with existing routines
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { HabitStackingInputSchema, HabitStackingOutputSchema, type HabitStackingInput, type HabitStackingOutput } from '@/types/ai-types';

export async function getHabitStackingSuggestions(input: HabitStackingInput): Promise<HabitStackingOutput> {
  return habitStackingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'habitStackingPrompt',
  input: { schema: HabitStackingInputSchema },
  output: { schema: HabitStackingOutputSchema },
  prompt: `You are a habit formation expert specializing in habit stacking - the technique of pairing new habits with existing routines.

Analyze the user's routine bubbles: {{{routineBubbles}}}
Existing user habits: {{{userHabits}}}
Time of day: {{{timeOfDay}}}

Generate 3-5 small, achievable habit suggestions that can be stacked before or after existing routine bubbles. Focus on:

1. **Micro-habits**: Very small habits (1-5 minutes) that are easy to maintain
2. **Natural connections**: Habits that logically flow with existing routines
3. **Progressive improvement**: Habits that compound over time
4. **Context matching**: Habits appropriate for the time and environment

Examples of good habit stacks:
- After "Morning Coffee" → "Write 3 gratitudes" (2 mins)
- Before "Work Block" → "Set 3 priorities" (2 mins)  
- After "Workout" → "Drink protein shake" (1 min)
- Before "Bedtime routine" → "Prep tomorrow's clothes" (3 mins)

For each suggestion, specify:
- habitTitle: Clear, actionable title
- description: Why this habit pairs well
- estimatedDuration: Realistic time estimate (1-10 minutes)
- category: Most appropriate category
- stackBefore: true for before the routine, false for after
- targetBubbleId: ID of the bubble to stack with
- reasoning: Brief explanation of the habit stack logic

Focus on habits that enhance productivity, wellbeing, or preparation for the target routine.`,
});

const habitStackingFlow = ai.defineFlow(
  {
    name: 'habitStackingFlow',
    inputSchema: HabitStackingInputSchema,
    outputSchema: HabitStackingOutputSchema,
  },
  async (input) => {
    const llm = googleAI.model('gemini-1.5-flash', { apiKey: input.apiKey });
    
    try {
      const { output } = await prompt(input, { model: llm });
      return output!;
    } catch (error: any) {
        if (error.status === 400) {
            throw new Error("Invalid API Key. Please check your key in the settings.");
        }
      console.warn('First attempt to get habit stacking suggestions failed, retrying...', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { output } = await prompt(input, { model: llm });
      return output!;
    }
  }
);
