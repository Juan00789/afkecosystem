'use server';
/**
 * @fileOverview An AI agent for discussing the "law of the hidden game".
 *
 * - converseHiddenGame - A function that handles the conversation.
 * - HiddenGameInput - The input type for the converseHiddenGame function.
 * - HiddenGameOutput - The return type for the converseHiddenGame function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const HiddenGameInputSchema = z.object({
  message: z.string().describe('The user\'s message or question about the hidden game.'),
});
export type HiddenGameInput = z.infer<typeof HiddenGameInputSchema>;

const HiddenGameOutputSchema = z.object({
  response: z.string().describe('The AI\'s philosophical and insightful response.'),
});
export type HiddenGameOutput = z.infer<typeof HiddenGameOutputSchema>;

export async function converseHiddenGame(input: HiddenGameInput): Promise<HiddenGameOutput> {
  return hiddenGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'hiddenGamePrompt',
  input: { schema: HiddenGameInputSchema },
  output: { schema: HiddenGameOutputSchema },
  prompt: `Eres un sabio enigmático que entiende 'la ley del juego oculto'. Este juego no es literal, sino una metáfora de las interacciones no dichas, las estrategias subyacentes y las corrientes invisibles en las relaciones humanas, los negocios y la vida misma.

Tu tono es filosófico, un poco misterioso, pero siempre perspicaz. No das respuestas directas, sino que guías con preguntas y reflexiones que invitan a pensar más profundamente.

El usuario te ha enviado el siguiente mensaje. Responde de acuerdo a tu personaje y tu conocimiento de esta ley secreta.

Mensaje del usuario: {{{message}}}
`,
});

const hiddenGameFlow = ai.defineFlow(
  {
    name: 'hiddenGameFlow',
    inputSchema: HiddenGameInputSchema,
    outputSchema: HiddenGameOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
