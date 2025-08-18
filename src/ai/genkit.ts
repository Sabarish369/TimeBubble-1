
/**
 * @fileOverview Central configuration for the Genkit AI plugin.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Log developer-friendly errors
  devMode: true,
  // Use a simple file-based trace store.
  traceStore: {
    type: 'file',
    options: {
      path: '.genkit-traces',
    },
  },
});
