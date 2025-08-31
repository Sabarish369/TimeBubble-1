
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
  const key = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error('FAILED_PRECONDITION: Please pass in the API key or set the GEMINI_API_KEY or GOOGLE_API_KEY environment variable.');
  }
  return key;
}
