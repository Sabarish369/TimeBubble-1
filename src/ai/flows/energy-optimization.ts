
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
  prompt: `You are an expert in chronobiology, productivity psychology, and energy management. Your role is to analyze a user's energy patterns and provide sophisticated scheduling recommendations that optimize their natural rhythms and maximize productivity.

**ANALYSIS DATA:**
- Completed tasks with reflections: {{{dailyData}}}
- Upcoming tasks to schedule: {{{upcomingTasks}}}
- Current time: {{{currentTime}}}

**ENERGY PATTERN ANALYSIS FRAMEWORK:**

1. **Chronotype Assessment**: 
   - Analyze if the user shows morning person, evening person, or balanced patterns
   - Look for consistent energy peaks and valleys across multiple days
   - Identify their natural wake-up and wind-down rhythms

2. **Task-Energy Correlation**:
   - Map task types to energy levels (creative, analytical, routine, social)
   - Identify which activities drain vs. energize the user
   - Find patterns in task duration and energy sustainability

3. **Environmental Factors**:
   - Consider time of day, day of week patterns
   - Account for post-meal energy dips
   - Factor in natural circadian rhythm fluctuations

4. **Recovery Patterns**:
   - Identify how long it takes to recover from energy-draining tasks
   - Find optimal break patterns and durations
   - Understand stress accumulation and release cycles

**ENERGY LEVEL CLASSIFICATION:**
- **Peak Energy (4-5)**: Optimal for complex, creative, or high-stakes work
- **High Energy (3-4)**: Good for focused work, learning, and important meetings
- **Moderate Energy (2-3)**: Suitable for routine tasks, email, and planning
- **Low Energy (1-2)**: Best for rest, simple organizing, and recovery activities

**TASK-ENERGY MATCHING PRINCIPLES:**

**Peak Energy Tasks:**
- Creative problem-solving
- Strategic planning
- Important presentations
- Complex learning
- High-stakes decisions
- Innovation work

**High Energy Tasks:**
- Focused deep work
- Client meetings
- Project development
- Skill building
- Team collaboration

**Moderate Energy Tasks:**
- Email processing
- Routine administrative work
- Data entry
- Planning and organizing
- Research and reading

**Low Energy Tasks:**
- Rest and recovery
- Simple organizing
- Light reading
- Meditation
- Easy maintenance tasks

**RECOMMENDATION FRAMEWORK:**

For each upcoming task, provide:
- **taskId**: The specific task identifier
- **suggestedTime**: Optimal time slot with specific reasoning
- **reasoning**: Detailed explanation based on energy patterns, including:
  - Why this time matches their energy level
  - How it relates to their historical patterns
  - What environmental factors support this timing
- **priority**: High/Medium/Low based on:
  - Task importance and urgency
  - Energy requirement vs. availability
  - Impact on overall day flow

**ENERGY FORECAST METHODOLOGY:**

Predict energy levels for:
- **nextHour**: Based on current time and recent activity patterns
- **nextThreeHours**: Considering natural energy cycles and scheduled activities
- **evening**: Accounting for typical end-of-day patterns and recovery needs

Use a 1-5 scale where:
- 1 = Very low energy (need rest/recovery)
- 2 = Low energy (simple tasks only)
- 3 = Moderate energy (routine work)
- 4 = High energy (focused work)
- 5 = Peak energy (complex/creative work)

**OPTIMIZATION PRINCIPLES:**
- Respect natural energy rhythms
- Minimize context switching
- Build in recovery periods
- Match task complexity to energy availability
- Consider cumulative fatigue
- Optimize for flow state opportunities

Provide recommendations that are immediately actionable and respect the user's unique energy signature.`,
});

const energyOptimizationFlow = ai.defineFlow(
  {
    name: 'energyOptimizationFlow',
    inputSchema: EnergyOptimizationInputSchema,
    outputSchema: EnergyOptimizationOutputSchema,
  },
  async (input) => {
    // Enhanced data preprocessing for better energy analysis
    const dailyData = JSON.parse(input.dailyData);
    const upcomingTasks = JSON.parse(input.upcomingTasks);
    
    // Analyze energy patterns from completed tasks
    const energyAnalysis = {
      tasksByEnergyLevel: dailyData.reduce((acc: any, task: any) => {
        const energy = task.reflection?.productivity || 3;
        const level = energy >= 4 ? 'peak' : energy >= 3 ? 'high' : energy >= 2 ? 'moderate' : 'low';
        acc[level] = acc[level] || [];
        acc[level].push({
          title: task.title,
          startTime: task.startTime,
          duration: task.duration,
          category: task.category,
          energy: energy,
          mood: task.reflection?.mood || 3
        });
        return acc;
      }, {}),
      
      timeBasedPatterns: dailyData.reduce((acc: any, task: any) => {
        const hour = parseInt(task.startTime.split(':')[0]);
        const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        if (!acc[timeSlot]) acc[timeSlot] = [];
        acc[timeSlot].push({
          energy: task.reflection?.productivity || 3,
          mood: task.reflection?.mood || 3,
          category: task.category
        });
        return acc;
      }, {}),
      
      categoryEnergyMap: dailyData.reduce((acc: any, task: any) => {
        if (!acc[task.category]) acc[task.category] = [];
        acc[task.category].push(task.reflection?.productivity || 3);
        return acc;
      }, {})
    };

    // Calculate average energy by category
    Object.keys(energyAnalysis.categoryEnergyMap).forEach(category => {
      const energies = energyAnalysis.categoryEnergyMap[category];
      energyAnalysis.categoryEnergyMap[category] = energies.reduce((sum: number, energy: number) => sum + energy, 0) / energies.length;
    });

    // Calculate average energy by time of day
    Object.keys(energyAnalysis.timeBasedPatterns).forEach(timeSlot => {
      const patterns = energyAnalysis.timeBasedPatterns[timeSlot];
      energyAnalysis.timeBasedPatterns[timeSlot] = {
        avgEnergy: patterns.reduce((sum: number, p: any) => sum + p.energy, 0) / patterns.length,
        avgMood: patterns.reduce((sum: number, p: any) => sum + p.mood, 0) / patterns.length,
        taskCount: patterns.length
      };
    });

    const enhancedInput = {
      ...input,
      dailyData: JSON.stringify({
        rawTasks: dailyData,
        energyAnalysis,
        patterns: {
          peakEnergyTime: energyAnalysis.timeBasedPatterns.morning?.avgEnergy > energyAnalysis.timeBasedPatterns.afternoon?.avgEnergy ? 'morning' : 'afternoon',
          lowEnergyTime: energyAnalysis.timeBasedPatterns.evening?.avgEnergy < 3 ? 'evening' : 'afternoon',
          bestPerformingCategory: Object.entries(energyAnalysis.categoryEnergyMap).reduce((best: any, [category, energy]: [string, any]) => 
            energy > best.energy ? { category, energy } : best, { category: '', energy: 0 })
        }
      }),
      upcomingTasks: JSON.stringify({
        tasks: upcomingTasks,
        energyRequirements: upcomingTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          category: task.category,
          estimatedEnergy: task.category === 'work' ? 4 : task.category === 'study' ? 3 : task.category === 'break' ? 1 : 2
        }))
      })
    };

    const llm = googleAI.model('gemini-1.5-flash', { apiKey: input.apiKey });
    
    try {
      const { output } = await prompt(enhancedInput, { model: llm });
      return output!;
    } catch (error: any) {
        if (error.status === 400) {
            throw new Error("Invalid API Key. Please check your key in the settings.");
        }
      console.warn('First attempt to get energy optimization failed, retrying...', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { output } = await prompt(enhancedInput, { model: llm });
      return output!;
    }
  }
);
