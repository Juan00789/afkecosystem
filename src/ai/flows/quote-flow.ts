'use server';
/**
 * @fileOverview A quote generation AI agent.
 *
 * - generateQuote - A function that handles the quote generation process.
 * - GenerateQuoteInput - The input type for the generateQuote function.
 * - GenerateQuoteOutput - The return type for the generateQuote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuoteInputSchema = z.object({
  clientName: z.string().describe('The full name of the client.'),
  providerName: z.string().describe('The full name of the service provider.'),
  projectDetails: z.string().describe('A detailed description of the project or service requested by the client.'),
});
export type GenerateQuoteInput = z.infer<typeof GenerateQuoteInputSchema>;

const QuoteItemSchema = z.object({
  description: z.string().describe('Description of the line item.'),
  quantity: z.number().describe('Quantity for the line item.'),
  unitPrice: z.number().describe('The price per unit.'),
  total: z.number().describe('The total price for the line item (quantity * unitPrice).'),
});

const GenerateQuoteOutputSchema = z.object({
  clientInfo: z.object({
    name: z.string().describe("The client's full name."),
  }).describe("Client's information."),
  providerInfo: z.object({
    name: z.string().describe("The provider's full name."),
  }).describe("Provider's information."),
  items: z.array(QuoteItemSchema).describe('A list of detailed items for the quote, including description, quantity, unit price, and total.'),
  subtotal: z.number().describe('The subtotal of all items before taxes.'),
  tax: z.number().describe('The calculated tax amount (e.g., 18% of the subtotal).'),
  grandTotal: z.number().describe('The final total amount (subtotal + tax).'),
  notes: z.string().optional().describe('Any additional notes, terms, or payment information.'),
});
export type GenerateQuoteOutput = z.infer<typeof GenerateQuoteOutputSchema>;

export async function generateQuote(
  input: GenerateQuoteInput,
): Promise<GenerateQuoteOutput> {
  return generateQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuotePrompt',
  input: { schema: GenerateQuoteInputSchema },
  output: { schema: GenerateQuoteOutputSchema },
  prompt: `You are a professional business assistant specialized in creating detailed and professional service quotes.

Based on the project details provided, break it down into a list of line items. For each item, provide a clear description, quantity, a reasonable unit price in local currency (assume Dominican Pesos, DOP), and calculate the total.

The project details are as follows:
{{projectDetails}}

Client: {{clientName}}
Provider: {{providerName}}

Please generate a complete quote structure. Calculate the subtotal by summing up all item totals. Calculate an 18% tax on the subtotal. Finally, provide the grand total. You may add professional notes at the end, for example, payment instructions or terms of service.
`,
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
  },
);
