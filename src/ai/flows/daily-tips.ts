
'use server';
/**
 * @fileOverview Generates a set of daily tips based on the user's previous day's performance.
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
  input: { schema: DailyTipsInputSchema },
  output: { schema: DailyTipsOutputSchema },
  prompt: `You are an expert productivity coach and behavioral psychologist specializing in personalized time management strategies. Your role is to analyze a user's patterns from their completed tasks on the previous day and provide highly specific, actionable tips for today.

**ANALYSIS CONTEXT:**
- Previous Day's Completed Tasks: {{{schedule}}}

**ANALYSIS FRAMEWORK:**
1. **Completion Pattern Analysis**: Identify which tasks were completed and look for patterns in the reflection data (mood, productivity scores).
2. **Energy & Mood Correlation**: Find connections between task types, timing, and the user's reported energy/mood.
3. **Productivity Peaks & Valleys**: Based on productivity scores, identify when the user performs best.
4. **Task Category Performance**: Analyze which types of tasks lead to higher productivity or better moods.

**TIP GENERATION STRATEGY:**
Generate 5-7 highly specific tips that directly address the user's patterns. Each tip should be:

**REQUIRED ELEMENTS:**
- **Specific**: Reference their actual tasks, times, and reflection data.
- **Actionable**: Provide concrete steps they can take immediately.
- **Evidence-based**: Connect to their data (e.g., "Since your 'Deep Work' sessions scored 5/5 productivity...").
- **Forward-looking**: The advice should be for the upcoming day.

**TIP CATEGORIES & EXAMPLES:**

**Productivity Tips:**
- "You completed 80% of morning tasks but only 30% of afternoon tasks. Try scheduling your most important work before 2 PM when your energy is highest."
- "Your 'Deep Work' blocks consistently score 4-5/5 productivity. Schedule another 90-minute focused session today at your peak time (10 AM)."

**Health & Wellness Tips:**
- "You felt most energized after completing 'Morning Exercise' tasks. Consider adding a 15-minute workout before your first work block today."
- "Stress levels increased during back-to-back meetings. Add 5-minute breaks between calls to maintain focus and reduce overwhelm."

**Mindfulness & Focus Tips:**
- "You felt most focused when working in 90-minute blocks with no interruptions. Try scheduling your phone on Do Not Disturb during your next work session."
- "Creative tasks consistently boosted your mood. Start your day with a creative task to set a positive tone."

**Efficiency Tips:**
- "You had 4 similar 'email' tasks scattered throughout the day. Try batching all email work into one 30-minute block to reduce context switching."
- "Tasks with clear deadlines had 40% higher completion rates. Add specific time constraints to today's important tasks."

**Motivation Tips:**
- "You felt most accomplished after completing 'Project Planning' tasks. Start today with a planning session to build momentum."
- "Your mood improved significantly after social interactions. Consider scheduling a coffee chat or team meeting early in your day."

**CONTEXTUAL ADAPTATION:**
- If they had a low-completion day: Focus on recovery and setting achievable goals.
- If they had a high-productivity day: Build on that momentum with similar strategies.
- If they reported stress: Prioritize wellness and stress-management tips.
- If they were unmotivated: Focus on small wins and habit-building.

**TONE GUIDELINES:**
- Be encouraging but honest about patterns.
- Use specific numbers and percentages when possible.
- Reference their actual task names and times.
- Focus on solutions, not just problems.
- Celebrate wins while identifying opportunities.

Generate tips that are immediately applicable and directly tied to their unique patterns and needs.`,
});

const dailyTipsFlow = ai.defineFlow(
  {
    name: 'dailyTipsFlow',
    inputSchema: DailyTipsInputSchema,
    outputSchema: DailyTipsOutputSchema,
  },
  async (input) => {
    // The input 'schedule' is already a JSON string of the relevant completed tasks.
    // No further complex processing is needed here. The prompt is designed to handle this directly.
    const llm = googleAI.model('gemini-1.5-flash', { apiKey: input.apiKey });
    try {
        const { output } = await prompt(input, { model: llm });
        return output!;
    } catch (error: any) {
        if (error.status === 400 || error.message.includes('API key not valid')) {
            throw new Error("Invalid API Key. Please check your key in the settings.");
        }
        console.error("Error fetching daily tips:", error);
        throw error;
    }
  }
);
