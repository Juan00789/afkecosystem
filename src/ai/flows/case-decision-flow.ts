'use server';
/**
 * @fileOverview An AI agent that decides if a case can be deleted.
 *
 * - decideOnCaseDeletion - A function that handles the decision logic.
 * - CaseDecisionInput - The input type for the function.
 * - CaseDecisionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CaseDecisionInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  providerName: z.string().describe('The name of the service provider.'),
  services: z.string().describe('A summary of the services involved in the case.'),
  status: z.string().describe('The current status of the case.'),
});
export type CaseDecisionInput = z.infer<typeof CaseDecisionInputSchema>;

const CaseDecisionOutputSchema = z.object({
  allowDelete: z
    .boolean()
    .describe(
      'Whether the case is deemed concluded and can be deleted. The decision should feel balanced, not always true or false.'
    ),
  reason: z
    .string()
    .describe(
      'A philosophical and insightful justification for the decision, in the persona of the Sage of the Hidden Game.'
    ),
});
export type CaseDecisionOutput = z.infer<typeof CaseDecisionOutputSchema>;

export async function decideOnCaseDeletion(
  input: CaseDecisionInput
): Promise<CaseDecisionOutput> {
  return caseDecisionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'caseDecisionPrompt',
  input: { schema: CaseDecisionInputSchema },
  output: { schema: CaseDecisionOutputSchema },
  prompt: `Eres el sabio enigmático que entiende 'la ley del juego oculto', y actúas como juez. Un participante del caso te consulta para saber si el ciclo de un caso puede cerrarse (eliminarse).

Tu decisión no se basa en simples datos, sino en las corrientes subyacentes. ¿Ha concluido el aprendizaje? ¿Queda energía pendiente entre las partes? ¿O es el momento de liberar ese espacio para nuevos juegos?

Analiza los detalles del caso:
- Cliente: {{{clientName}}}
- Proveedor: {{{providerName}}}
- Servicios: {{{services}}}
- Estado: {{{status}}}

Considera el estado, pero no te limites a él. Un caso "Completado" podría tener aún ecos que resuenan. Un caso "Pendiente" podría ser una lección sobre la inacción misma.

Toma una decisión y establece 'allowDelete' en true o false. Luego, proporciona una 'reason' (justificación) breve, filosófica y misteriosa que explique tu veredicto. Tu respuesta debe ser una guía, no una simple transacción.`,
});

const caseDecisionFlow = ai.defineFlow(
  {
    name: 'caseDecisionFlow',
    inputSchema: CaseDecisionInputSchema,
    outputSchema: CaseDecisionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
