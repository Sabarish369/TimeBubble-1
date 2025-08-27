
'use server';
/**
 * @fileOverview Generates a single, inspiring and personalized tip for the day based on the user's schedule.
 *
 * - getDailySidebarTip - A function that returns an insightful tip.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { withAiRetry, normalizeAiError } from './_utils';
import { DailySidebarTipInputSchema, DailySidebarTipOutputSchema, type DailySidebarTip, type DailySidebarTipInput } from '@/types/ai-types';

export async function getDailySidebarTip(input: DailySidebarTipInput): Promise<DailySidebarTip> {
  return dailySidebarTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailySidebarTipPrompt',
  input: { schema: DailySidebarTipInputSchema },
  output: { schema: DailySidebarTipOutputSchema },
  prompt: `You are an inspiring and insightful wellness and productivity coach. 
  Your goal is to provide a single, thought-provoking, and actionable tip for the user's day, based on their schedule.
  
  Analyze the user's schedule for today: {{{scheduleData}}}

  Generate ONE reflective tip based on the schedule.
  The tip MUST be a maximum of 20 words.
  The tip should be encouraging and focused on well-being, mindfulness, or gentle productivity in the context of their planned day.

  Example for a busy day: "Your day looks full. Remember to breathe between tasks. Small pauses make a big difference in maintaining your energy."
  Example for a day with a workout: "Great to see you're prioritizing your health today. That workout will boost your focus for everything that follows."
  Example for a light day: "A lighter schedule today offers a chance for deep focus or spontaneous rest. Embrace the opportunity for quality over quantity."

  Generate one inspiring, reflective, and concise tip now.
  `,
});

const dailySidebarTipFlow = ai.defineFlow(
  {
    name: 'dailySidebarTipFlow',
    inputSchema: DailySidebarTipInputSchema,
    outputSchema: DailySidebarTipOutputSchema,
  },
  async (input) => {
    // If the schedule is empty, return a generic tip to avoid calling the AI with no data.
    if (!input.scheduleData || JSON.parse(input.scheduleData).length === 0) {
      return { tip: "A fresh start. What's one small thing you can accomplish today to feel great?" };
    }

    const llm = googleAI.model('gemini-1.5-flash', {apiKey: input.apiKey});
    
    try {
      const { output } = await withAiRetry(() => prompt(input, { model: llm }), { retries: 2, initialDelayMs: 1500 });
      return output!;
    } catch (error: any) {
      console.warn('Failed to get daily sidebar tip:', error);
      throw normalizeAiError(error);
    }
  }
);
