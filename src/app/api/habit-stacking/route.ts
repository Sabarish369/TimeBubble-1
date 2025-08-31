import { NextRequest, NextResponse } from 'next/server';
import { getHabitStackingSuggestions } from '@/ai/flows/habit-stacking';
import type { HabitStackingInput } from '@/types/ai-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routineBubbles, userHabits, timeOfDay, apiKey }: HabitStackingInput = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!routineBubbles) {
      return NextResponse.json(
        { error: 'Routine bubbles are required' },
        { status: 400 }
      );
    }

    const result = await getHabitStackingSuggestions({
      routineBubbles,
      userHabits,
      timeOfDay,
      apiKey
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Habit stacking API error:', error);
    
    // Check if it's a rate limit error
    if (error.message && error.message.includes('429')) {
      return NextResponse.json(
        { error: '429 Too Many Requests - API rate limit exceeded. Please update your Gemini API key.' },
        { status: 429 }
      );
    }
    
    // Check if it's an invalid API key error
    if (error.message && /api key not valid|invalid api key/i.test(error.message)) {
      return NextResponse.json(
        { error: 'Invalid API Key. Please check your key in the settings.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate habit stacking suggestions' },
      { status: 500 }
    );
  }
}