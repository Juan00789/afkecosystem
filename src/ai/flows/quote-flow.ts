
'use server';
/**
 * @fileOverview Un agente de IA para generar cotizaciones de proyectos.
 *
 * - generateQuote - Una función que maneja la generación de cotizaciones.
 * - GenerateQuoteInput - El tipo de entrada para la función generateQuote.
 * - GenerateQuoteOutput - El tipo de retorno para la función generateQuote.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateQuoteInputSchema = z.object({
  clientName: z.string().describe('El nombre del cliente o empresa.'),
  projectName: z.string().describe('El nombre del proyecto para el cual es la cotización.'),
  projectDetails: z.string().describe('Una descripción detallada del alcance y los requerimientos del proyecto.'),
});
export type GenerateQuoteInput = z.infer<typeof GenerateQuoteInputSchema>;

const GenerateQuoteOutputSchema = z.object({
  summary: z.string().describe('Un resumen muy breve (máximo 10 palabras) de la cotización. Por ejemplo: "Cotización para Sitio Web Corporativo".'),
  quoteText: z.string().describe('El texto completo y profesional de la cotización, formateado para ser enviado al cliente.'),
});
export type GenerateQuoteOutput = z.infer<typeof GenerateQuoteOutputSchema>;

export async function generateQuote(input: GenerateQuoteInput): Promise<GenerateQuoteOutput> {
  return generateQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuotePrompt',
  input: { schema: GenerateQuoteInputSchema },
  output: { schema: GenerateQuoteOutputSchema },
  prompt: `Eres un asistente experto en la creación de cotizaciones para servicios de consultoría y desarrollo de software. Tu tono debe ser profesional, claro y convincente.

  Basado en la siguiente información, genera una cotización formal.

  Cliente: {{{clientName}}}
  Proyecto: {{{projectName}}}
  Detalles del Proyecto: {{{projectDetails}}}

  La cotización debe incluir:
  1.  Un saludo cordial y profesional dirigido al cliente.
  2.  Una introducción que mencione el nombre del proyecto.
  3.  Una sección que resuma el alcance del trabajo basado en los detalles proporcionados.
  4.  Una sección de próximos pasos.
  5.  Una despedida profesional.

  NO inventes precios ni fechas. En lugar de eso, utiliza placeholders como "[Monto a convenir]" o "[Fecha de entrega estimada]".
  Genera el texto completo de la cotización en el campo 'quoteText' y un resumen corto en el campo 'summary'.`,
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
