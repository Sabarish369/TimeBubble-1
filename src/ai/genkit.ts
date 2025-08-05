'use server';
/**
 * @fileOverview Central configuration for the Genkit AI plugin.
 */

import genkit from '@genkit-ai/next';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // The Genkit v1.x API has changed and these options are not supported here.
  // logLevel: 'debug',
  // enableTracingAndMetrics: true,
});
