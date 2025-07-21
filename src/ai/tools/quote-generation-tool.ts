'use server';
/**
 * @fileOverview A Genkit tool for creating a quote.
 */
import { ai } from '@/ai/genkit';
import { generateQuote, type GenerateQuoteOutput } from '@/ai/flows/quote-flow';
import { z } from 'zod';

export const quoteCreationTool = ai.defineTool(
  {
    name: 'quoteCreationTool',
    description: 'Generates a new quote based on project details. Use this when a user asks to create a quote.',
    inputSchema: z.object({
      clientName: z.string().describe("The client's full name."),
      projectDetails: z.string().describe('A detailed description of the project or service requested by the client.'),
    }),
    outputSchema: z.custom<GenerateQuoteOutput>(),
  },
  async (input, {getFlowState}) => {
    // In a real app, you would get the provider's name and bank details from their session or profile.
    // For this prototype, we'll use placeholder data.
    const state = getFlowState();
    const providerName = state.providerName || "El Emprendedor";
    const bankDetails = state.bankDetails || "Banco Popular, Cuenta: 123456789";

    console.log(`Generating a quote for client: ${input.clientName}`);
    return await generateQuote({ ...input, providerName, bankDetails });
  }
);
