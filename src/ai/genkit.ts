
/**
 * @fileOverview Central configuration for the Genkit AI plugin.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const isProd = process.env.NODE_ENV === 'production';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Enable developer-friendly errors only in non-production
  devMode: !isProd,
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
