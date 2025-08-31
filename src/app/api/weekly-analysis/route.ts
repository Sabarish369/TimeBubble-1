import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyAnalysis } from '@/ai/flows/weekly-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekData, previousWeekData, apiKey } = body;

    // Use provided API key or fall back to environment variables
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: 'API key is required. Please provide an API key or set the GEMINI_API_KEY environment variable.' },
        { status: 400 }
      );
    }

    const result = await getWeeklyAnalysis({
      weekData,
      previousWeekData,
      apiKey: effectiveApiKey
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Weekly analysis API error:', error);
    
    // Check if it's a rate limit error
    if (error.message && error.message.includes('429')) {
      return NextResponse.json(
        { error: '429 Too Many Requests - API rate limit exceeded. Please update your Gemini API key.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate weekly analysis' },
      { status: 500 }
    );
  }
}
