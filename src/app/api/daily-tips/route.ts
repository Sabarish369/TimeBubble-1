import { NextRequest, NextResponse } from 'next/server';
import { getDailyTips } from '@/ai/flows/daily-tips';
import type { DailyTipsInput } from '@/types/ai-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      schedule, 
      historicalPatterns, 
      userPreferences, 
      contextualData, 
      previousTipsFeedback, 
      userGoals, 
      apiKey 
    }: DailyTipsInput = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!schedule || !historicalPatterns) {
      return NextResponse.json(
        { error: 'Schedule and historical patterns are required' },
        { status: 400 }
      );
    }

    const result = await getDailyTips({
      schedule,
      historicalPatterns,
      userPreferences,
      contextualData,
      previousTipsFeedback,
      userGoals,
      apiKey
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Daily tips API error:', error);
    
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
      { error: error.message || 'Failed to generate daily tips' },
      { status: 500 }
    );
  }
}