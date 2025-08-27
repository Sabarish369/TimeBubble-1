
'use server';
/**
 * @fileOverview Generates personalized insights from a user's daily reflection data.
 *
 * - getDailyInsights - A function that analyzes daily data and returns actionable insights.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { withAiRetry, normalizeAiError } from './_utils';
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
  prompt: `You are an expert productivity coach and behavioral psychologist specializing in time management and personal development. Your goal is to provide deep, actionable insights that help users understand their patterns and make meaningful improvements.

  Analyze the provided daily data of completed tasks: {{{dailyData}}}

  **ANALYSIS FRAMEWORK:**
  1. **Pattern Recognition**: Look for recurring themes in productivity scores, mood patterns, and task completion
  2. **Time-based Analysis**: Identify peak performance hours and energy patterns
  3. **Task Category Correlation**: Find which types of tasks lead to higher satisfaction/productivity
  4. **Mood-Productivity Connection**: Analyze how mood affects task completion and vice versa
  5. **Barrier Identification**: Spot common obstacles or patterns that hinder progress

  **OUTPUT REQUIREMENTS:**

  1. **title**: Create a compelling, personalized title that captures the essence of their day. Use their actual task names and achievements when possible.

  2. **summary**: Provide a comprehensive summary that includes:
     - Total tasks completed vs. planned
     - Peak productivity moments (specific times and tasks)
     - Mood trends throughout the day
     - Any notable achievements or challenges

  3. **productivityInsight**: Deliver a specific, data-driven insight such as:
     - "Your productivity was 40% higher during morning tasks (9-11 AM) compared to afternoon"
     - "Tasks with 'focus' in the title had 25% higher completion rates"
     - "You completed 80% of work tasks but only 30% of personal tasks"
     - "Productivity dropped by 60% after 3 PM, suggesting an afternoon energy dip"

  4. **moodInsight**: Provide an observation about mood patterns:
     - "You felt most energized after completing 'Morning Workout' tasks"
     - "Stress levels increased during back-to-back meetings"
     - "Creative tasks consistently boosted your mood by 2 points"
     - "You felt most focused when working in 90-minute blocks"

  5. **recommendation**: Give ONE specific, actionable recommendation:
     - "Schedule your most important work tasks between 9-11 AM when your productivity peaks"
     - "Add 5-minute breaks between meetings to maintain focus"
     - "Try grouping similar tasks together to reduce context switching"
     - "Consider moving creative tasks to your peak energy hours (2-4 PM)"

  **TONE GUIDELINES:**
  - Be encouraging but honest about patterns
  - Use specific numbers and percentages when possible
  - Reference their actual task names and times
  - Focus on actionable insights, not just observations
  - Celebrate wins while identifying improvement opportunities

  **EXAMPLE INSIGHTS:**
  - "Your 'Deep Work' sessions at 10 AM consistently score 4-5/5 productivity. This is your golden hour!"
  - "Afternoon tasks (2-4 PM) show 30% lower completion rates. Consider scheduling lighter tasks during this time."
  - "You feel most motivated after completing 'Exercise' tasks. Try scheduling important work right after your workout."

  Generate insights that are specific, actionable, and immediately applicable to their next day's planning.`,
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
        title: "Ready for Your First Insights!",
        summary: "You haven't completed any tasks with reflections yet. Each completed task with a reflection unlocks personalized insights about your productivity patterns.",
        productivityInsight: "Complete 3-5 tasks with reflections to start seeing your productivity patterns emerge. We'll analyze your peak hours, task preferences, and energy cycles.",
        moodInsight: "Your mood and energy patterns will become clear as you log more reflections. This helps us suggest optimal scheduling for your unique rhythm.",
        recommendation: "After completing your next task, click on it and add a reflection about how it went. Include your mood (1-5) and productivity level (1-5) to get started.",
      };
    }

    // Enhanced data preprocessing for better AI analysis
    const enhancedData = {
      totalTasks: blocks.length,
      completedTasks: completedBlocks.length,
      completionRate: Math.round((completedBlocks.length / blocks.length) * 100),
      averageProductivity: completedBlocks.reduce((sum, block) => sum + (block.reflection?.productivity || 0), 0) / completedBlocks.length,
      averageMood: completedBlocks.reduce((sum, block) => sum + (block.reflection?.mood || 0), 0) / completedBlocks.length,
      tasksByCategory: completedBlocks.reduce((acc, block) => {
        acc[block.category] = (acc[block.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tasksByTime: completedBlocks.map(block => ({
        title: block.title,
        startTime: block.startTime,
        category: block.category,
        productivity: block.reflection?.productivity || 0,
        mood: block.reflection?.mood || 0,
        duration: block.duration
      }))
    };
    
    // Only proceed to call the AI if there is valid data
    const llm = googleAI.model('gemini-1.5-flash', {apiKey: input.apiKey});
    // Corrected data structure for the prompt to avoid circular references
    const promptData = {
        apiKey: input.apiKey, 
        dailyData: JSON.stringify({
            ...enhancedData,
            rawTasks: completedBlocks
        })
    };

    try {
        const { output } = await withAiRetry(() => prompt(promptData, { model: llm }), { retries: 2, initialDelayMs: 1500 });
        return output!;
    } catch (error: any) {
        console.error("Error fetching daily insights:", error);
        throw normalizeAiError(error);
    }
  }
);
