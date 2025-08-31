import { NextRequest, NextResponse } from 'next/server';
import { getEnergyOptimizationSuggestions } from '@/ai/flows/energy-optimization';
import type { EnergyOptimizationInput } from '@/types/ai-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dailyData, upcomingTasks, currentTime, apiKey }: EnergyOptimizationInput = body;

    // Use provided API key or fall back to environment variables
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: 'API key is required. Please provide an API key or set the GEMINI_API_KEY environment variable.' },
        { status: 400 }
      );
    }

    if (!dailyData) {
      return NextResponse.json(
        { error: 'Daily data is required' },
        { status: 400 }
      );
    }

    const result = await getEnergyOptimizationSuggestions({
      dailyData,
      upcomingTasks,
      currentTime,
      apiKey: effectiveApiKey
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Energy optimization API error:', error);
    
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
      { error: error.message || 'Failed to generate energy optimization suggestions' },
      { status: 500 }
    );
  }
}