'use server';
/**
 * @fileOverview An AI agent for generating professional project quotes.
 *
 * - generateQuote - A function that handles quote generation.
 * - GenerateQuoteInput - The input type for the generateQuote function.
 * - GenerateQuoteOutput - The return type for the generateQuote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateQuoteInputSchema = z.object({
  clientName: z.string().describe('The name of the client or company.'),
  projectName: z.string().describe('The name of the project for the quote.'),
  projectDetails: z.string().describe('A detailed description of the project scope and requirements.'),
  // Provider details
  providerName: z.string().optional().describe('The service provider\'s name.'),
  providerCompany: z.string().optional().describe('The provider\'s company name.'),
  providerWebsite: z.string().optional().describe('The provider\'s website.'),
  providerBankName: z.string().optional().describe('The provider\'s bank name for payments.'),
  providerAccountNumber: z.string().optional().describe('The provider\'s account number for payments.'),
});
export type GenerateQuoteInput = z.infer<typeof GenerateQuoteInputSchema>;

const QuoteItemSchema = z.object({
    description: z.string().describe('A clear and concise description of the line item or service.'),
    quantity: z.number().describe('The quantity of the item or service. Default to 1 if not specified.'),
    unitPrice: z.number().describe('The price per unit of the item or service.'),
    total: z.number().describe('The total price for this line item (quantity * unitPrice).'),
});

const GenerateQuoteOutputSchema = z.object({
  summary: z.string().describe('A very brief summary (max 10 words) of the quote. E.g., "Quote for Corporate Website".'),
  notes: z.string().describe('Any additional notes, terms, or clarifications for the client.'),
  items: z.array(QuoteItemSchema).describe('A list of all billable items or services for the project.'),
  subtotal: z.number().describe('The sum of all item totals before taxes.'),
  tax: z.number().describe('The calculated tax amount. Assume a standard 18% tax rate (ITBIS in DR) unless specified otherwise. Calculate it from the subtotal.'),
  grandTotal: z.number().describe('The final total amount (subtotal + tax).'),
});
export type GenerateQuoteOutput = z.infer<typeof GenerateQuoteOutputSchema>;

export async function generateQuote(input: GenerateQuoteInput): Promise<GenerateQuoteOutput> {
  return generateQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuotePrompt',
  input: { schema: GenerateQuoteInputSchema },
  output: { schema: GenerateQuoteOutputSchema },
  prompt: `You are an expert assistant specializing in creating detailed and professional quotes for software development and consulting services. Your tone should be clear, professional, and convincing.

  Based on the following information, generate a formal quote in a structured format.

  **Client and Project Information:**
  - Client: {{{clientName}}}
  - Project: {{{projectName}}}
  - Project Details: {{{projectDetails}}}

  **Provider Information (You):**
  - Name: {{#if providerName}}{{{providerName}}}{{else}}N/A{{/if}}
  - Company: {{#if providerCompany}}{{{providerCompany}}}{{else}}N/A{{/if}}

  **Quote Generation Instructions:**
  1.  **Analyze Project Details:** Carefully read the project details. Break down the work into logical, billable line items (e.g., "UI/UX Design," "Frontend Development - Home Page," "Backend API Integration," "Database Setup").
  2.  **Estimate and Price:** For each line item, estimate the quantity (e.g., hours, pages, features) and assign a realistic, professional unit price. You MUST invent professional and credible prices. Calculate the total for each item.
  3.  **Calculate Totals:**
      *   Calculate the 'subtotal' by summing the 'total' of all line items.
      *   Calculate an 18% 'tax' on the subtotal.
      *   Calculate the 'grandTotal' by adding the subtotal and the tax.
  4.  **Add Notes:** Write brief, relevant notes. Mention the estimated delivery timeline (e.g., "Estimated delivery: 4-6 weeks") and payment terms (e.g., "Payment Terms: 50% upfront, 50% upon completion"). If provider bank details are available, include them here: "Payments can be made to {{providerBankName}} account {{providerAccountNumber}}".
  5.  **Create Summary:** Generate a concise summary for the quote.

  **IMPORTANT:** Populate all fields of the structured output, including the array of items and all calculated financial figures. The response must be a valid JSON object matching the output schema.`,
});

const generateQuoteFlow = ai.defineFlow(
  {
    name: 'generateQuoteFlow',
    inputSchema: GenerateQuoteInputSchema,
    outputSchema: GenerateQuoteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
