
'use server';
/**
 * @fileOverview Generates personalized insights from a user's daily reflection data.
 *
 * - getDailyInsights - A function that analyzes daily data and returns actionable insights.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { DailyInsightsInputSchema, DailyInsightsOutputSchema, type DailyInsights, type DailyInsightsInput } from '@/types/ai-types';
import { TimeBlock } from '@/types';

export async function getDailyInsights(input: DailyInsightsInput): Promise<DailyInsights> {
  return dailyInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyInsightsPrompt',
  input: { schema: DailyInsightsInputSchema },
  output: { schema: DailyInsightsOutputSchema },
  prompt: `You are a friendly and insightful time management and wellness coach.
  Your goal is to analyze a user's completed tasks and reflections for the day and provide a personalized, encouraging, and actionable summary.
  
  Analyze the provided daily data of completed tasks: {{{dailyData}}}

  Based on the data, generate the following:
  1.  **title**: A creative and fitting title for the day.
  2.  **summary**: A brief, engaging summary of the user's day.
  3.  **productivityInsight**: An insight about their productivity. Find a pattern or a specific success.
  4.  **moodInsight**: An observation about their mood. Connect it to activities if possible.
  5.  **recommendation**: A single, actionable piece of advice for tomorrow.

  Keep the tone positive and celebratory. The user is looking for encouragement and self-understanding, not criticism.
  Example Insight: "Your productivity was highest in the morning after your 'Workout' bubble. Great job starting the day strong!"
  Example Recommendation: "You felt most focused during your 90-minute work blocks. Maybe try scheduling another one tomorrow afternoon?"
  `,
});

const dailyInsightsFlow = ai.defineFlow(
  {
    name: 'dailyInsightsFlow',
    inputSchema: DailyInsightsInputSchema,
    outputSchema: DailyInsightsOutputSchema,
  },
  async (input) => {
    // Parse the input data and check if there are any completed tasks with reflections
    const blocks: TimeBlock[] = JSON.parse(input.dailyData);
    const completedBlocks = blocks.filter(b => b.completed && b.reflection);

    if (completedBlocks.length === 0) {
      return {
        title: "Ready for Insights?",
        summary: "You haven't completed any tasks with reflections for this day yet.",
        productivityInsight: "Complete some tasks and log how they went to unlock your personalized productivity insights.",
        moodInsight: "We can't wait to see how your activities and mood connect!",
        recommendation: "After your next task, click on it and add a reflection to get started.",
      };
    }
    
    // Only proceed to call the AI if there is valid data
    const llm = googleAI.model('gemini-1.5-flash', {apiKey: input.apiKey});
    try {
        const { output } = await prompt({ ...input, dailyData: JSON.stringify(completedBlocks) }, {model: llm});
        return output!;
    } catch (error: any) {
        if (error.status === 400) {
            throw new Error("Invalid API Key. Please check your key in the settings.");
        }
        if (error.status === 429) { // Specifically handle "Too Many Requests"
            await new Promise(resolve => setTimeout(resolve, 5000));
            const { output } = await prompt({ ...input, dailyData: JSON.stringify(completedBlocks) }, {model: llm});
            return output!;
        }
        // Fallback for other errors
        console.error("Error fetching daily insights:", error);
        throw error;
    }
  }
);
