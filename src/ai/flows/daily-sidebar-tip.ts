
'use server';
/**
 * @fileOverview Generates a single, inspiring tip for the day.
 *
 * - getDailySidebarTip - A function that returns an insightful tip.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { DailySidebarTipInputSchema, DailySidebarTipOutputSchema, type DailySidebarTip, type DailySidebarTipInput } from '@/types/ai-types';

export async function getDailySidebarTip(input: DailySidebarTipInput): Promise<DailySidebarTip> {
  return dailySidebarTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailySidebarTipPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: DailySidebarTipInputSchema },
  output: { schema: DailySidebarTipOutputSchema },
  prompt: `You are an inspiring and insightful wellness and productivity coach. 
  Your goal is to provide a single, thought-provoking, and actionable tip for the user's day, based on the date: {{{date}}}.

  The tip should be a short, single paragraph. It should be encouraging and focused on well-being, mindfulness, or gentle productivity.

  Example Tip: "A 5-minute walk can reset your entire day. Notice the small things on your path – the color of the sky, the sound of your footsteps. It’s a simple way to practice mindfulness and boost your mood."
  Example Tip: "Instead of multitasking, try 'single-tasking'. Give one activity your full attention, even if just for 15 minutes. You'll be amazed at the clarity and quality you achieve."

  Generate one inspiring tip for today.
  `,
});

const dailySidebarTipFlow = ai.defineFlow(
  {
    name: 'dailySidebarTipFlow',
    inputSchema: DailySidebarTipInputSchema,
    outputSchema: DailySidebarTipOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output!;
    } catch (error) {
      // Simple retry mechanism for transient errors like 503
      console.warn('First attempt to get daily tip failed, retrying in 2 seconds...', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { output } = await prompt(input);
      return output!;
    }
  }
);
