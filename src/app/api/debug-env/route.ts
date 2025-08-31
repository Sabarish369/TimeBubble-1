import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Debug environment variables (safely)
  const envDebug = {
    NODE_ENV: process.env.NODE_ENV,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGoogleKey: !!process.env.GOOGLE_API_KEY,
    geminiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'NOT_SET',
    googleKeyPrefix: process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 10) + '...' : 'NOT_SET',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(envDebug);
}