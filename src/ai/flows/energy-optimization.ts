
'use server';
/**
 * @fileOverview AI flow for energy optimization and scheduling recommendations.
 *
 * - getEnergyOptimizationSuggestions - Suggests optimal timing based on energy patterns
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
  prompt: `You are an expert in chronobiology and productivity optimization. Analyze energy patterns to suggest optimal task scheduling.

Energy history data: {{{energyHistory}}}
Upcoming tasks: {{{upcomingTasks}}}
Current time: {{{currentTime}}}

Based on the user's energy patterns, provide:

1. **Task-Time Matching Recommendations**: Match high-energy tasks with peak energy periods and low-energy tasks with recovery periods.

2. **Energy Level Forecasting**: Predict energy levels for upcoming time periods based on historical patterns.

Task-Energy Matching Guidelines:
- **High Energy (4-5)**: Creative work, problem-solving, learning, important meetings, physical exercise
- **Medium Energy (3)**: Routine tasks, email processing, planning, light administrative work
- **Low Energy (1-2)**: Rest, meditation, easy reading, simple organizing, passive activities

For each recommendation:
- taskId: ID of the task to reschedule
- suggestedTime: Optimal time slot (e.g., "9:00 AM" or "2:00 PM")
- energyMatch: Description of energy-task alignment
- reasoning: Why this timing optimizes productivity
- priority: Urgency of the scheduling change

For energy forecast:
- Predict energy levels for next hour, next 3 hours, and evening
- Base predictions on historical patterns and current trajectory
- Use scale 1-5 (1=very low, 5=very high)

Focus on maximizing productivity while respecting natural energy rhythms and avoiding burnout.`,
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
