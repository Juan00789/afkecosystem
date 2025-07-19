
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
  // Provider details
  providerName: z.string().optional().describe('El nombre del proveedor del servicio.'),
  providerCompany: z.string().optional().describe('El nombre de la empresa del proveedor.'),
  providerWebsite: z.string().optional().describe('El sitio web del proveedor.'),
  providerBankName: z.string().optional().describe('El nombre del banco del proveedor para pagos.'),
  providerAccountNumber: z.string().optional().describe('El número de cuenta del proveedor para pagos.'),
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

  **Información del Cliente y Proyecto:**
  - Cliente: {{{clientName}}}
  - Proyecto: {{{projectName}}}
  - Detalles del Proyecto: {{{projectDetails}}}

  **Información del Proveedor (Tú):**
  - Nombre: {{#if providerName}}{{{providerName}}}{{else}}N/A{{/if}}
  - Empresa: {{#if providerCompany}}{{{providerCompany}}}{{else}}N/A{{/if}}
  - Sitio Web: {{#if providerWebsite}}{{{providerWebsite}}}{{else}}N/A{{/if}}
  - Banco para Pagos: {{#if providerBankName}}{{{providerBankName}}}{{else}}N/A{{/if}}
  - Número de Cuenta: {{#if providerAccountNumber}}{{{providerAccountNumber}}}{{else}}N/A{{/if}}

  **Instrucciones para la Cotización:**
  1.  Un saludo cordial y profesional dirigido al cliente.
  2.  Una introducción que mencione el nombre del proyecto.
  3.  Una sección que resuma el alcance del trabajo basado en los detalles proporcionados.
  4.  Una sección de "Próximos Pasos".
  5.  Si se proporcionaron datos bancarios (banco y número de cuenta), incluye una sección de "Información de Pago" con esos detalles. Si no, omite esta sección.
  6.  Una despedida profesional. Utiliza el nombre del proveedor y de la empresa (si está disponible) en la firma.

  **Importante:** NO inventes precios ni fechas. En lugar de eso, utiliza placeholders como "[Monto a convenir]" o "[Fecha de entrega estimada]".
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
