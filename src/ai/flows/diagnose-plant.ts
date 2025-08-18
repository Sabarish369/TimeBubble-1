
'use server';
/**
 * @fileOverview A plant problem diagnosis AI agent.
 *
 * - diagnosePlant - A function that handles the plant diagnosis process.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { DiagnosePlantInputSchema, DiagnosePlantOutputSchema, type DiagnosePlantInput, type DiagnosePlantOutput } from '@/types/ai-types';

export async function diagnosePlant(input: DiagnosePlantInput): Promise<DiagnosePlantOutput> {
  return diagnosePlantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnosePlantPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: {schema: DiagnosePlantInputSchema},
  output: {schema: DiagnosePlantOutputSchema},
  prompt: `You are an expert botanist specializing diagnosing plant illnesses.

You will use this information to diagnose the plant, and any issues it has. You will make a determination as to whether the plant is healthy or not, and what is wrong with it, and set the isHealthy output field appropriately.

Use the following as the primary source of information about the plant.

Description: {{{description}}}
Photo: {{media url=photoDataUri}}`,
});

const diagnosePlantFlow = ai.defineFlow(
  {
    name: 'diagnosePlantFlow',
    inputSchema: DiagnosePlantInputSchema,
    outputSchema: DiagnosePlantOutputSchema,
  },
  async input => {
    const llm = googleAI.model('gemini-1.5-flash', {apiKey: input.apiKey});
    const {output} = await prompt(input, {model: llm});
    return output!;
  }
);
