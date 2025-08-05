'use server';
/**
 * @fileOverview Central configuration for the Genkit AI plugin.
 */
import { config } from 'dotenv';
config();

import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { genkitEval, GenkitMetric } from 'genkit/eval';
import { dotprompt } from '@genkit-ai/dotprompt';

configureGenkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
    dotprompt(),
    genkitEval({
      judge: 'googleai/gemini-1.5-flash-latest',
      metrics: [GenkitMetric.Faithfulness, GenkitMetric.AnswerRelevancy],
      embedder: 'googleai/text-embedding-004',
    }),
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

export { genkit as ai };
