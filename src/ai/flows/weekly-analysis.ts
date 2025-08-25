'use server';

/**
 * @fileOverview Generates a structured weekly analysis from the user's last 7 days of data.
 * Input expects pre-aggregated weekly JSON to ensure accuracy; the model summarizes and fills gaps.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { WeeklyAnalysisInputSchema, WeeklyAnalysisOutputSchema, type WeeklyAnalysisInput, type WeeklyAnalysisOutput } from '@/types/ai-types';

export async function getWeeklyAnalysis(input: WeeklyAnalysisInput): Promise<WeeklyAnalysisOutput> {
  return weeklyAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weeklyAnalysisPrompt',
  input: { schema: WeeklyAnalysisInputSchema },
  output: { schema: WeeklyAnalysisOutputSchema },
  prompt: `You are an expert productivity analyst.
You will receive a week's worth of structured data and (optionally) computed metrics. Your job is to produce a precise, consistent weekly report using the required JSON schema.

Data: {{{weeklyData}}}
Metrics (optional): {{{computedMetrics}}}
Week: {{{weekRangeLabel}}}

Guidelines:
- Use only facts present in the data/metrics. If uncertain, state so briefly.
- Prefer concrete numbers, time ranges, and categories.
- bestFocusWindows should be clear, non-overlapping windows like "09:00–11:00".
- topWins and bottlenecks must be succinct and evidence-based.
- recommendations must be specific (who/what/when) and testable next week.
- nextWeekPlan should contain exactly three prioritized goals with strong rationales.
- daySummaries: one line per day with a meaningful highlight.

Return the response as valid JSON matching the schema exactly.`,
});

const weeklyAnalysisFlow = ai.defineFlow(
  {
    name: 'weeklyAnalysisFlow',
    inputSchema: WeeklyAnalysisInputSchema,
    outputSchema: WeeklyAnalysisOutputSchema,
  },
  async (input) => {
    const llm = googleAI.model('gemini-1.5-flash', { apiKey: input.apiKey });
    try {
      const { output } = await prompt(input, { model: llm });
      return output!;
    } catch (error: any) {
      if (error.status === 400) {
        throw new Error('Invalid API Key. Please check your key in the settings.');
      }
      // simple retry
      await new Promise((r) => setTimeout(r, 2000));
      const { output } = await prompt(input, { model: llm });
      return output!;
    }
  }
);

