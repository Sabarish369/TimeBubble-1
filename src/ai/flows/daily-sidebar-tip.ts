
'use server';
/**
 * @fileOverview Generates a single, inspiring and personalized tip for the day based on the user's schedule.
 *
 * - getDailySidebarTip - A function that returns an insightful tip.
 */

import { ai, getApiKey } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { withAiRetry, normalizeAiError } from './_utils';
import { DailySidebarTipInputSchema, DailySidebarTipOutputSchema, type DailySidebarTipInput } from '@/types/ai-types';
import type { DailySidebarTip } from '@/types';

// Smart caching and pattern recognition helpers
const CACHE_KEY_PREFIX = 'smart_tip_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function generateScheduleSignature(scheduleData: any[]): string {
  // Create a signature based on schedule patterns, not exact times
  const patterns = scheduleData.map(block => ({
    category: block.category,
    duration: Math.round(block.duration / 30) * 30, // Round to 30min intervals
    timeOfDay: getTimeOfDay(block.startTime)
  }));
  
  return JSON.stringify(patterns.sort((a, b) => a.category.localeCompare(b.category)));
}

function getTimeOfDay(startTime: string): string {
  const hour = new Date(startTime).getHours();
  if (hour < 9) return 'early';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getCachedTipBySignature(signature: string): string | null {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + signature);
    if (cached) {
      const { tip, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return tip;
      }
      localStorage.removeItem(CACHE_KEY_PREFIX + signature);
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
}

function cacheScheduleTip(signature: string, tip: string): void {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    localStorage.setItem(CACHE_KEY_PREFIX + signature, JSON.stringify({
      tip,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Cache write error:', e);
  }
}

function getPatternBasedTip(scheduleData: any[]): string | null {
  const totalDuration = scheduleData.reduce((sum, block) => sum + block.duration, 0);
  const workBlocks = scheduleData.filter(b => b.category === 'work').length;
  const meetingBlocks = scheduleData.filter(b => b.title.toLowerCase().includes('meeting')).length;
  
  // Heavy meeting day
  if (meetingBlocks >= 4) {
    return "Take 2 minutes between meetings to reset your focus and prepare mentally.";
  }
  
  // Light day
  if (totalDuration < 240) { // Less than 4 hours
    return "Use this lighter day for deep work on your most important long-term project.";
  }
  
  // Heavy work day
  if (workBlocks >= 6) {
    return "Schedule 5-minute breaks every 90 minutes to maintain peak performance all day.";
  }
  
  // Mixed day with gaps
  const hasLargeGaps = scheduleData.some((block, i) => {
    if (i === 0) return false;
    const prevEnd = new Date(scheduleData[i-1].startTime).getTime() + (scheduleData[i-1].duration * 60000);
    const currentStart = new Date(block.startTime).getTime();
    return (currentStart - prevEnd) > 2 * 60 * 60 * 1000; // 2+ hour gap
  });
  
  if (hasLargeGaps) {
    return "Use your schedule gaps for focused work on tasks requiring deep concentration.";
  }
  
  return null; // No pattern match, will use AI
}

function getIntelligentFallback(scheduleData: any[]): string {
  const fallbacks = [
    "Focus on completing your highest-priority task first thing this morning.",
    "Block distractions during your most important work sessions today.",
    "Take brief breaks between tasks to maintain energy and focus.",
    "Prepare for tomorrow by reviewing your schedule before ending today.",
    "Use transition time between activities to reset and refocus your mind."
  ];
  
  // Choose based on schedule characteristics
  const workBlocks = scheduleData.filter(b => b.category === 'work').length;
  if (workBlocks > 4) {
    return "Schedule 5-minute breaks between work blocks to maintain peak performance.";
  }
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export async function getDailySidebarTip(input: DailySidebarTipInput): Promise<DailySidebarTip> {
  return dailySidebarTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailySidebarTipPrompt',
  input: { schema: DailySidebarTipInputSchema },
  output: { schema: DailySidebarTipOutputSchema },
  prompt: `You are a highly effective productivity and wellness coach who gives actionable, specific advice.
  Your goal is to provide ONE immediately actionable tip that the user can apply TODAY based on their actual schedule.
  
  Analyze the user's schedule for today: {{{scheduleData}}}

  Generate ONE specific, actionable tip (maximum 20 words) that:
  - Addresses a real opportunity in their schedule
  - Can be implemented immediately
  - Provides concrete value for their day
  - Uses active, direct language

  Focus on:
  - Time gaps: "Use your 2-hour gap between meetings for deep work on your most important task."
  - Energy optimization: "Schedule your creative work before 10am when your energy peaks."
  - Transition strategies: "Take 2 minutes between each meeting to reset your focus and intentions."
  - Workload balance: "Your packed afternoon needs 5-minute breathing breaks between each task."
  - Preparation tactics: "Prep tomorrow's priorities during your 30-minute evening wind-down."
  - Focus enhancement: "Block distractions during your 90-minute morning focus block for maximum impact."

  Make it specific to their actual schedule, not generic advice. Be direct and actionable.
  `,
});

const dailySidebarTipFlow = ai.defineFlow(
  {
    name: 'dailySidebarTipFlow',
    inputSchema: DailySidebarTipInputSchema,
    outputSchema: DailySidebarTipOutputSchema,
  },
  async (input) => {
    const scheduleData = input.scheduleData ? JSON.parse(input.scheduleData) : [];
    
    // Smart fallback system - avoid API calls for common scenarios
    if (scheduleData.length === 0) {
      const emptyDayTips = [
        "Block 2 hours this morning for your most important project before distractions creep in.",
        "Choose 3 specific tasks now and tackle them before checking any notifications.",
        "Use this open day to batch similar tasks together for maximum efficiency.",
        "Set a 25-minute timer and focus completely on one meaningful task right now.",
        "Plan tomorrow's top 3 priorities during a 15-minute session this evening."
      ];
      const randomTip = emptyDayTips[Math.floor(Math.random() * emptyDayTips.length)];
      return { tip: randomTip };
    }

    // Generate schedule signature for intelligent caching
    const scheduleSignature = generateScheduleSignature(scheduleData);
    
    // Check for cached tip with same schedule pattern
    const cachedTip = getCachedTipBySignature(scheduleSignature);
    if (cachedTip) {
      console.log('Using cached tip for similar schedule pattern');
      return { tip: cachedTip };
    }

    // Use pattern-based tips for common schedule types to reduce API calls
    const patternTip = getPatternBasedTip(scheduleData);
    if (patternTip) {
      console.log('Using pattern-based tip, avoiding API call');
      return { tip: patternTip };
    }

    // Only call AI for complex/unique schedules
    const effectiveApiKey = getApiKey(input.apiKey);
    const llm = googleAI.model('gemini-1.5-flash', { apiKey: effectiveApiKey });
    
    try {
      const { output } = await withAiRetry(() => prompt(input, { model: llm }), { retries: 1, initialDelayMs: 1000 });
      
      // Cache the result with schedule signature
      if (output?.tip) {
        cacheScheduleTip(scheduleSignature, output.tip);
      }
      
      return output!;
    } catch (error: any) {
      console.warn('AI call failed, using fallback tip:', error);
      // Return smart fallback instead of throwing error
      return { tip: getIntelligentFallback(scheduleData) };
    }
  }
);
