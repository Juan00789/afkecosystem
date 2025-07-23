// src/modules/invoicing/types/index.ts
import * as z from 'zod';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

const quoteItemSchema = z.object({
  serviceId: z.string().optional(),
  description: z.string().min(1, "La descripción no puede estar vacía."),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
});

export const quoteSchema = z.object({
  clientName: z.string().min(2, "El nombre del cliente es requerido."),
  clientAddress: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "Debes añadir al menos un ítem."),
  notes: z.string().optional(),
  includeITBIS: z.boolean().default(true),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

const quoteAnalysisInputSchema = z.object({
  clientName: z.string(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  notes: z.string().optional(),
});
export type QuoteAnalysisInput = z.infer<typeof quoteAnalysisInputSchema>;

export const quoteAnalysisOutputSchema = z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    suggestions: z.array(z.string()),
});
export type QuoteAnalysisOutput = z.infer<typeof quoteAnalysisOutputSchema>;
