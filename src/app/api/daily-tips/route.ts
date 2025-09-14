import { NextRequest, NextResponse } from 'next/server';
import { getDailyTips } from '@/ai/flows/daily-tips';
import type { DailyTipsInput } from '@/types/ai-types';

// Daily refresh limit (not exposed to frontend)
const DAILY_REFRESH_LIMIT = 20;
const refreshCounts = new Map<string, { count: number; date: string }>();

function checkDailyLimit(userId: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const userRefresh = refreshCounts.get(userId);
  
  if (!userRefresh || userRefresh.date !== today) {
    refreshCounts.set(userId, { count: 1, date: today });
    return true;
  }
  
  if (userRefresh.count >= DAILY_REFRESH_LIMIT) {
    return false;
  }
  
  userRefresh.count++;
  return true;
}

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
      apiKey,
      userId 
    }: DailyTipsInput & { userId?: string } = body;

    // Check daily refresh limit (silent limit, not shown to user)
    if (userId && !checkDailyLimit(userId)) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 429 }
      );
    }

    // Require user to provide their own API key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required. Please provide your own Gemini API key in the settings.' },
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