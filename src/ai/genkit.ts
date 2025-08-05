'use server';
/**
 * @fileOverview Central configuration for the Genkit AI plugin.
 */
import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
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
