
/**
 * @fileOverview Central configuration for the Genkit AI plugin.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const isProd = process.env.NODE_ENV === 'production';

// Get API key from environment variables for Genkit initialization
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export const ai = genkit({
  plugins: [
    // Initialize with environment variable if available, otherwise without API key
    // Individual flows will use the API key passed from the user
    apiKey ? googleAI({ apiKey }) : googleAI(),
  ],
  // Avoid filesystem trace store in production/serverless to prevent runtime errors
  ...(isProd ? {} : {
    traceStore: {
      type: 'file',
      options: {
        path: '.genkit-traces',
      },
    },
  }),
});

// Export helper function to get API key for flows
export function getApiKey(userApiKey?: string): string {
  // Priority: user-provided key > environment variable
  const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const key = userApiKey || envKey;
  
  // Debug logging (only in development)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 API Key Debug:', {
      hasUserKey: !!userApiKey,
      hasEnvGeminiKey: !!process.env.GEMINI_API_KEY,
      hasEnvGoogleKey: !!process.env.GOOGLE_API_KEY,
      envGeminiPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'NOT_SET',
      envGooglePrefix: process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 10) + '...' : 'NOT_SET',
      finalKeyAvailable: !!key,
      finalKeyPrefix: key ? key.substring(0, 10) + '...' : 'NO_KEY'
    });
  }
  
  if (!key) {
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'FAILED_PRECONDITION: Please pass in the API key or set the GEMINI_API_KEY or GOOGLE_API_KEY environment variable.'
      : `FAILED_PRECONDITION: No API key available. Please either:\n1. Set GEMINI_API_KEY in your .env file\n2. Set GOOGLE_API_KEY in your .env file\n3. Pass an API key as parameter\nCurrent env: GEMINI_API_KEY=${process.env.GEMINI_API_KEY || 'NOT_SET'}, GOOGLE_API_KEY=${process.env.GOOGLE_API_KEY || 'NOT_SET'}`;
    throw new Error(errorMessage);
  }
  return key;
}
