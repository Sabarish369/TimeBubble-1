import { NextRequest, NextResponse } from 'next/server';
import { getDailySidebarTip } from '@/ai/flows/daily-sidebar-tip';
import type { DailySidebarTipInput } from '@/types/ai-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduleData, apiKey }: DailySidebarTipInput = body;

    // Require user to provide their own API key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required. Please provide your own Gemini API key in the settings.' },
        { status: 400 }
      );
    }

    if (!scheduleData) {
      return NextResponse.json(
        { error: 'Schedule data is required' },
        { status: 400 }
      );
    }

    const result = await getDailySidebarTip({
      scheduleData,
      apiKey
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Daily sidebar tip API error:', error);
    
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
      { error: error.message || 'Failed to generate daily sidebar tip' },
      { status: 500 }
    );
  }
}