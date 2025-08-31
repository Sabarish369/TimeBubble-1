/**
 * @fileOverview Central configuration for the Genkit AI plugin.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const isProd = process.env.NODE_ENV === 'production';

export const ai = genkit({
  plugins: [
    // Initialize without API key - individual flows will use the API key passed from the user
    googleAI(),
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
  // Require user-provided key, no fallback to environment variables
  if (!userApiKey) {
    throw new Error('FAILED_PRECONDITION: A valid Gemini API key is required. Please provide your own API key in the settings.');
  }
  return userApiKey;
}