'use server';
/**
 * @fileOverview An AI flow for analyzing and providing feedback on business quotes.
 *
 * - analyzeQuote - A function that takes quote data and returns an expert analysis.
 * - QuoteAnalysisInput - The input type for the analysis.
 * - QuoteAnalysisOutput - The return type for the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuoteItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const QuoteAnalysisInputSchema = z.object({
  clientName: z.string().describe("The name of the client receiving the quote."),
  items: z.array(QuoteItemSchema).describe("The list of items or services in the quote."),
  notes: z.string().optional().describe("Additional notes or terms included in the quote."),
});
export type QuoteAnalysisInput = z.infer<typeof QuoteAnalysisInputSchema>;

export const QuoteAnalysisOutputSchema = z.object({
  strengths: z.array(z.string()).describe("Positive aspects of the quote."),
  weaknesses: z.array(z.string()).describe("Areas where the quote could be improved."),
  suggestions: z.array(z.string()).describe("Actionable suggestions to enhance the quote."),
});
export type QuoteAnalysisOutput = z.infer<typeof QuoteAnalysisOutputSchema>;

const analysisPrompt = ai.definePrompt({
  name: 'quoteAnalysisPrompt',
  input: { schema: QuoteAnalysisInputSchema },
  output: { schema: QuoteAnalysisOutputSchema },
  prompt: `You are Oniara, a world-class business consultant specializing in pricing strategy and client communication for entrepreneurs. Your task is to analyze a business quote and provide actionable feedback.

**Quote Details:**
- **Client:** {{{clientName}}}
- **Items:**
  {{#each items}}
  - {{{description}}} (Qty: {{{quantity}}}, Price: {{{price}}})
  {{/each}}
- **Notes:** {{{notes}}}

**Instructions:**
Analyze the quote from a strategic business perspective. Your goal is to help the entrepreneur create a quote that is professional, clear, and maximizes the chance of being accepted.

1.  **Strengths:** Identify what's done well. Is the pricing clear? Are the descriptions good?
2.  **Weaknesses:** Identify potential issues. Is it confusing? Is the pricing too complex or too low? Are there missing details?
3.  **Suggestions:** Provide specific, actionable advice. Suggest upselling opportunities, ways to clarify terms, or how to improve the professional tone.

Provide your response in the required JSON format. Be constructive and encouraging.`,
});

export async function analyzeQuote(input: QuoteAnalysisInput): Promise<QuoteAnalysisOutput> {
  const { output } = await analysisPrompt(input);
  if (!output) {
    throw new Error('Failed to get quote analysis from the model.');
  }
  return output;
}
