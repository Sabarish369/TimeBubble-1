
'use server';

/**
 * @fileOverview Smart suggestion AI agent.
 *
 * - getSmartSuggestions - A function that suggests planning improvements.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { SmartSuggestionsInputSchema, SmartSuggestionsOutputSchema, type SmartSuggestionsInput, type SmartSuggestionsOutput } from '@/types/ai-types';


export async function getSmartSuggestions(input: SmartSuggestionsInput): Promise<SmartSuggestionsOutput> {
  return smartSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSuggestionsPrompt',
  input: {schema: SmartSuggestionsInputSchema},
  output: {schema: SmartSuggestionsOutputSchema},
  prompt: `You are a personal time management assistant. Analyze the user's daily data and preferences to provide smart suggestions to improve their time planning.

User Preferences: {{{userPreferences}}}

Daily Data: {{{dailyData}}}

Provide suggestions to improve their schedule, increase productivity, and promote well-being. Return your suggestions as an array of strings.
`,
});

const smartSuggestionsFlow = ai.defineFlow(
  {
    name: 'smartSuggestionsFlow',
    inputSchema: SmartSuggestionsInputSchema,
    outputSchema: SmartSuggestionsOutputSchema,
  },
  async input => {
    const llm = googleAI.model('gemini-1.5-flash', {apiKey: input.apiKey});
    const {output} = await prompt(input, {model: llm});
    return output!;
  }
);
