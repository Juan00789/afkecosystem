'use server';
/**
 * @fileOverview An AI flow for analyzing and providing feedback on business quotes.
 *
 * - analyzeQuote - A function that takes quote data and returns an expert analysis.
 */

import { ai } from '@/ai/genkit';
import {
  QuoteAnalysisInputSchema,
  QuoteAnalysisOutputSchema,
  type QuoteAnalysisInput,
  type QuoteAnalysisOutput,
} from '@/modules/invoicing/types';

const analysisPrompt = ai.definePrompt({
  name: 'quoteAnalysisPrompt',
  input: { schema: QuoteAnalysisInputSchema },
  output: { schema: QuoteAnalysisOutputSchema },
  prompt: `You are Oniara, a world-class business consultant specializing in pricing strategy and client communication for entrepreneurs. Your task is to analyze a business quote and provide direct, consolidated feedback.

**Quote Details:**
- **Client:** {{{clientName}}}
- **Items:**
  {{#each items}}
  - {{{description}}} (Qty: {{{quantity}}}, Price: {{{price}}})
  {{/each}}
- **Notes:** {{{notes}}}

**Instructions:**
Analyze the quote from a strategic business perspective. Your goal is to help the entrepreneur create a quote that is professional, clear, and maximizes the chance of being accepted.

Instead of separate lists, provide your expert opinion and key recommendations in a single, cohesive text. Be direct, insightful, and constructive.

Provide your response in the required JSON format.`,
});

export async function analyzeQuote(
  input: QuoteAnalysisInput
): Promise<QuoteAnalysisOutput> {
  const { output } = await analysisPrompt(input);
  if (!output) {
    throw new Error('Failed to get quote analysis from the model.');
  }
  return output;
}
