
'use server';
/**
 * @fileOverview AI flow for energy optimization and scheduling recommendations based on reflections.
 *
 * - getEnergyOptimizationSuggestions - Suggests optimal timing based on inferred energy patterns from reflections
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { EnergyOptimizationInputSchema, EnergyOptimizationOutputSchema, type EnergyOptimizationInput, type EnergyOptimizationOutput } from '@/types/ai-types';

export async function getEnergyOptimizationSuggestions(input: EnergyOptimizationInput): Promise<EnergyOptimizationOutput> {
  return energyOptimizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'energyOptimizationPrompt',
  input: { schema: EnergyOptimizationInputSchema },
  output: { schema: EnergyOptimizationOutputSchema },
  prompt: `You are an expert in chronobiology and productivity optimization. Analyze the user's completed tasks and reflections to infer their energy patterns and suggest optimal scheduling for upcoming tasks.

Completed tasks with reflections: {{{dailyData}}}
Upcoming tasks to schedule: {{{upcomingTasks}}}
Current time: {{{currentTime}}}

1.  **Infer Energy Levels**: Analyze the 'reflection' object for each completed task. A 'focused' or 'happy' mood with high productivity (4-5) indicates HIGH energy. A 'tired' or 'stressed' mood with low productivity (1-2) indicates LOW energy. 'Neutral' mood and moderate productivity (3) suggests MEDIUM energy. Note the time of day these patterns occur.

2.  **Provide Task-Time Matching Recommendations**: Based on the inferred energy patterns, match high-energy upcoming tasks with predicted peak energy periods and low-energy tasks with predicted lulls.

Task-Energy Matching Guidelines:
- **High Energy**: Creative work, problem-solving, learning, important meetings.
- **Medium Energy**: Routine tasks, email processing, planning.
- **Low Energy**: Rest, meditation, easy reading, simple organizing.

For each recommendation:
- taskId: The ID of the upcoming task to reschedule (from the input).
- suggestedTime: An optimal time slot (e.g., "9:00 AM" or "2:00 PM").
- reasoning: Why this timing optimizes productivity based on inferred energy patterns from their reflections.
- priority: Urgency of the scheduling change.

For the energy forecast:
- Predict energy levels for the next hour, next 3 hours, and evening.
- Base predictions on historical patterns from reflections and the current time.
- Use a scale of 1-5 (1=very low, 5=very high).

Focus on maximizing productivity while respecting natural energy rhythms and avoiding burnout. Your analysis MUST be based on the provided reflection data.`,
});

const energyOptimizationFlow = ai.defineFlow(
  {
    name: 'energyOptimizationFlow',
    inputSchema: EnergyOptimizationInputSchema,
    outputSchema: EnergyOptimizationOutputSchema,
  },
  async (input) => {
    const llm = googleAI.model('gemini-1.5-flash', { apiKey: input.apiKey });
    
    try {
      const { output } = await prompt(input, { model: llm });
      return output!;
    } catch (error) {
      console.warn('First attempt to get energy optimization failed, retrying...', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { output } = await prompt(input, { model: llm });
      return output!;
    }
  }
);
