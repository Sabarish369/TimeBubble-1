
'use server';
/**
 * @fileOverview AI flow for generating habit stacking suggestions.
 *
 * - getHabitStackingSuggestions - Suggests small habits to stack with existing routines
 */

import { ai, getApiKey } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { HabitStackingInputSchema, HabitStackingOutputSchema, type HabitStackingInput, type HabitStackingOutput } from '@/types/ai-types';

export async function getHabitStackingSuggestions(input: HabitStackingInput): Promise<HabitStackingOutput> {
  return habitStackingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'habitStackingPrompt',
  input: { schema: HabitStackingInputSchema },
  output: { schema: HabitStackingOutputSchema },
  prompt: `You are a behavioral psychologist and habit formation expert specializing in habit stacking - the technique of pairing new habits with existing routines to create sustainable behavior change.

**ANALYSIS CONTEXT:**
- User's routine bubbles: {{{routineBubbles}}}
- Existing user habits: {{{userHabits}}}
- Time of day: {{{timeOfDay}}}

**HABIT STACKING PRINCIPLES:**

1. **Behavioral Psychology Foundation**:
   - Use existing cues (routine bubbles) as triggers for new habits
   - Leverage the power of implementation intentions
   - Build on established neural pathways
   - Create clear, specific action plans

2. **Habit Formation Science**:
   - Start with micro-habits (1-5 minutes) for higher success rates
   - Ensure new habits are immediately rewarding
   - Create clear visual and environmental cues
   - Build consistency before increasing complexity

3. **Integration Strategy**:
   - Natural flow: New habit should logically follow or precede the routine
   - Minimal friction: Reduce barriers to habit execution
   - Context matching: Align habit type with time of day and environment
   - Progressive complexity: Start simple, build gradually

**HABIT CATEGORIES & EXAMPLES:**

**Productivity Habits:**
- "Set 3 priorities for the day" (2 mins) - Stack before work blocks
- "Review today's accomplishments" (3 mins) - Stack after work blocks
- "Prepare tomorrow's task list" (5 mins) - Stack before bedtime routine

**Health & Wellness Habits:**
- "Drink a glass of water" (1 min) - Stack after morning routine
- "Take 3 deep breaths" (1 min) - Stack before stressful tasks
- "Stretch for 2 minutes" (2 mins) - Stack after sitting for long periods

**Mindfulness Habits:**
- "Write 1 gratitude" (1 min) - Stack after positive experiences
- "Set intention for next task" (1 min) - Stack before important work
- "Mindful transition" (30 seconds) - Stack between different activities

**Learning & Growth Habits:**
- "Read 1 page of book" (2 mins) - Stack after meals
- "Practice 1 new skill" (3 mins) - Stack during breaks
- "Reflect on 1 lesson learned" (2 mins) - Stack after completing tasks

**Organization Habits:**
- "Clear workspace" (2 mins) - Stack before starting work
- "Organize 1 digital folder" (3 mins) - Stack during computer time
- "Declutter 1 small area" (2 mins) - Stack during transitions

**SUGGESTION CRITERIA:**

For each habit suggestion, provide:

1. **habitTitle**: Clear, actionable title that's easy to remember
2. **description**: Specific explanation of the habit and its benefits
3. **estimatedDuration**: Realistic time estimate (1-10 minutes maximum)
4. **category**: Most appropriate category (work, study, break, personal, health)
5. **stackBefore**: Boolean indicating if habit should come before (true) or after (false) the routine
6. **targetBubbleId**: Specific routine bubble to stack with
7. **reasoning**: Detailed explanation of why this habit stack will work, including:
   - How it leverages the existing routine as a cue
   - Why the timing and context are optimal
   - What makes it easy to remember and execute
   - How it creates immediate value or satisfaction

**OPTIMIZATION GUIDELINES:**

- **Morning Routines**: Focus on energy, focus, and intention-setting habits
- **Work Blocks**: Emphasize productivity, organization, and stress-management habits
- **Break Times**: Suggest wellness, learning, and recovery habits
- **Evening Routines**: Prioritize reflection, planning, and relaxation habits

**SUCCESS FACTORS:**
- Keep habits extremely small and achievable
- Ensure immediate positive feedback
- Create clear visual or environmental cues
- Match habit complexity to available time and energy
- Consider the user's current stress level and capacity

Generate 3-5 highly specific habit suggestions that are tailored to the user's existing routines and current time of day. Focus on habits that will provide immediate value and build sustainable behavior change.`,
});

const habitStackingFlow = ai.defineFlow(
  {
    name: 'habitStackingFlow',
    inputSchema: HabitStackingInputSchema,
    outputSchema: HabitStackingOutputSchema,
  },
  async (input) => {
    // Enhanced data preprocessing for better habit suggestions
    const routineBubbles = JSON.parse(input.routineBubbles);
    const userHabits = JSON.parse(input.userHabits);
    
    // Analyze routine patterns for better habit matching
    const routineAnalysis = {
      morningRoutines: routineBubbles.filter((bubble: any) => {
        const hour = parseInt(bubble.startTime?.split(':')[0] || '0');
        return hour < 12;
      }),
      workBlocks: routineBubbles.filter((bubble: any) => 
        bubble.category === 'work' || bubble.title.toLowerCase().includes('work')
      ),
      breakActivities: routineBubbles.filter((bubble: any) => 
        bubble.category === 'break' || bubble.title.toLowerCase().includes('break')
      ),
      eveningRoutines: routineBubbles.filter((bubble: any) => {
        const hour = parseInt(bubble.startTime?.split(':')[0] || '0');
        return hour >= 17;
      }),
      highFrequencyRoutines: routineBubbles.filter((bubble: any) => 
        bubble.duration && bubble.duration > 30 // Longer routines are better for stacking
      )
    };

    // Analyze existing habits to avoid conflicts
    const existingHabitTypes = userHabits.map((habit: any) => habit.type || habit.category);
    const habitGaps = {
      missingProductivity: !existingHabitTypes.includes('productivity'),
      missingWellness: !existingHabitTypes.includes('wellness'),
      missingMindfulness: !existingHabitTypes.includes('mindfulness'),
      missingLearning: !existingHabitTypes.includes('learning'),
      missingOrganization: !existingHabitTypes.includes('organization')
    };

    const enhancedInput = {
      apiKey: input.apiKey,
      timeOfDay: input.timeOfDay,
      routineBubbles: JSON.stringify({
        routines: routineBubbles,
        analysis: {
          timeOfDay: input.timeOfDay,
          routineCount: routineBubbles.length,
          averageDuration: routineBubbles.length > 0 ? routineBubbles.reduce((sum: number, bubble: any) => 
            sum + (bubble.duration || 0), 0) / routineBubbles.length : 0,
          categories: routineBubbles.reduce((acc: any, bubble: any) => {
            acc[bubble.category] = (acc[bubble.category] || 0) + 1;
            return acc;
          }, {}),
          routineAnalysis,
          habitGaps
        }
      }),
      userHabits: JSON.stringify({
        habits: userHabits,
        analysis: {
          totalHabits: userHabits.length,
          habitTypes: existingHabitTypes,
          gaps: habitGaps,
          successRate: userHabits.length > 0 ? userHabits.reduce((sum: number, habit: any) => 
            sum + (habit.successRate || 0), 0) / userHabits.length : 0,
        }
      })
    };

    const llm = googleAI.model('gemini-1.5-flash', { apiKey: getApiKey(input.apiKey) });
    
    try {
      const { output } = await prompt(enhancedInput, { model: llm });
      return output!;
    } catch (error: any) {
        if (error.status === 400 || error.message.includes('API key not valid')) {
            throw new Error("Invalid API Key. Please check your key in the settings.");
        }
        if (error.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const { output } = await prompt(enhancedInput, { model: llm });
          return output!;
        }
        console.error('Error getting habit stacking suggestions:', error);
        throw error;
    }
  }
);
