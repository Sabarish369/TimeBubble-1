import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyAnalysis } from '@/ai/flows/weekly-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekData, previousWeekData, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const result = await getWeeklyAnalysis({
      weekData,
      previousWeekData,
      apiKey
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
