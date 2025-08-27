
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
  prompt: `You are an expert productivity coach and behavioral psychologist specializing in personalized time management strategies. Your role is to analyze a user's patterns and provide highly specific, actionable tips that address their unique challenges and opportunities.

**ANALYSIS CONTEXT:**
- Previous Day's Schedule: {{{schedule}}}

**ANALYSIS FRAMEWORK:**
1. **Completion Pattern Analysis**: Identify which tasks were completed vs. missed and why
2. **Energy & Mood Correlation**: Find connections between task types, timing, and user's energy/mood
3. **Productivity Peaks & Valleys**: Identify when the user performs best and struggles
4. **Task Category Performance**: Analyze which types of tasks lead to success or stress
5. **Barrier Identification**: Spot common obstacles (time management, energy, motivation, etc.)

**TIP GENERATION STRATEGY:**
Generate 5-7 highly specific tips that directly address the user's patterns. Each tip should be:

**REQUIRED ELEMENTS:**
- **Specific**: Reference their actual tasks, times, and patterns
- **Actionable**: Provide concrete steps they can take immediately
- **Evidence-based**: Connect to their actual data and patterns
- **Timely**: Relevant to their current situation and upcoming day

**TIP CATEGORIES & EXAMPLES:**

**Productivity Tips:**
- "You completed 80% of morning tasks but only 30% of afternoon tasks. Try scheduling your most important work before 2 PM when your energy is highest."
- "Your 'Deep Work' blocks consistently score 4-5/5 productivity. Schedule another 90-minute focused session today at your peak time (10 AM)."

**Health & Wellness Tips:**
- "You felt most energized after completing 'Morning Exercise' tasks. Consider adding a 15-minute workout before your first work block today."
- "Stress levels increased during back-to-back meetings. Add 5-minute breaks between calls to maintain focus and reduce overwhelm."

**Mindfulness & Focus Tips:**
- "You felt most focused when working in 90-minute blocks with no interruptions. Try scheduling your phone on Do Not Disturb during your next work session."
- "Creative tasks consistently boosted your mood by 2 points. Start your day with a creative task to set a positive tone."

**Efficiency Tips:**
- "You had 4 similar 'email' tasks scattered throughout the day. Try batching all email work into one 30-minute block to reduce context switching."
- "Tasks with clear deadlines had 40% higher completion rates. Add specific time constraints to today's important tasks."

**Motivation Tips:**
- "You felt most accomplished after completing 'Project Planning' tasks. Start today with a planning session to build momentum."
- "Your mood improved significantly after social interactions. Consider scheduling a coffee chat or team meeting early in your day."

**CONTEXTUAL ADAPTATION:**
- If they had a low-completion day: Focus on recovery and setting achievable goals
- If they had a high-productivity day: Build on that momentum with similar strategies
- If they're stressed: Prioritize wellness and stress-management tips
- If they're unmotivated: Focus on small wins and habit-building

**TONE GUIDELINES:**
- Be encouraging but honest about patterns
- Use specific numbers and percentages when possible
- Reference their actual task names and times
- Focus on solutions, not just problems
- Celebrate wins while identifying opportunities

Generate tips that are immediately applicable and directly tied to their unique patterns and needs.`,
});

const dailyTipsFlow = ai.defineFlow(
  {
    name: 'dailyTipsFlow',
    inputSchema: DailyTipsInputSchema,
    outputSchema: DailyTipsOutputSchema,
  },
  async (input) => {
    // Enhanced data preprocessing for better tip generation
    const scheduleData = JSON.parse(input.schedule);
    
    // Analyze completion patterns
    const completedTasks = scheduleData.filter((task: any) => task.completed);
    const missedTasks = scheduleData.filter((task: any) => !task.completed);
    const completionRate = scheduleData.length > 0 ? Math.round((completedTasks.length / scheduleData.length) * 100) : 0;
    
    // Analyze productivity patterns
    const highProductivityTasks = completedTasks.filter((task: any) => 
      task.reflection && task.reflection.productivity >= 4
    );
    const lowProductivityTasks = completedTasks.filter((task: any) => 
      task.reflection && task.reflection.productivity <= 2
    );
    
    // Analyze mood patterns
    const positiveMoodTasks = completedTasks.filter((task: any) => 
      task.reflection && task.reflection.mood >= 4
    );
    const negativeMoodTasks = completedTasks.filter((task: any) => 
      task.reflection && task.reflection.mood <= 2
    );

    const enhancedInput = {
      apiKey: input.apiKey,
      schedule: JSON.stringify({
        analysis: {
          completionRate,
          completedTasks: completedTasks.length,
          missedTasks: missedTasks.length,
          highProductivityTasks: highProductivityTasks.length,
          lowProductivityTasks: lowProductivityTasks.length,
          positiveMoodTasks: positiveMoodTasks.length,
          negativeMoodTasks: negativeMoodTasks.length,
          tasksByCategory: completedTasks.reduce((acc: any, task: any) => {
            acc[task.category] = (acc[task.category] || 0) + 1;
            return acc;
          }, {}),
          tasksByTime: completedTasks.map((task: any) => ({
            title: task.title,
            startTime: task.startTime,
            category: task.category,
            productivity: task.reflection?.productivity || 0,
            mood: task.reflection?.mood || 0
          }))
        }
      }),
      productivityPatterns: "{}", // Pass empty object as historical patterns are no longer used.
    };

    const llm = googleAI.model('gemini-1.5-flash', {apiKey: input.apiKey});
    try {
        const { output } = await prompt(enhancedInput, {model: llm});
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
