// src/modules/invoicing/types/index.ts
import * as z from 'zod';
import type { Timestamp } from 'firebase/firestore';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrl?: string;
}

const quoteItemSchema = z.object({
  serviceId: z.string().optional(),
  description: z.string().min(1, 'La descripción no puede estar vacía.'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1.'),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
});

export const quoteSchema = z.object({
  clientName: z.string().min(2, 'El nombre del cliente es requerido.'),
  clientAddress: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'Debes añadir al menos un ítem.'),
  notes: z.string().optional(),
  includeITBIS: z.boolean().default(true),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

const QuoteItemAnalysisSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const QuoteAnalysisInputSchema = z.object({
  clientName: z.string().describe('The name of the client receiving the quote.'),
  items: z.array(QuoteItemAnalysisSchema).describe('The list of items or services in the quote.'),
  notes: z.string().optional().describe('Additional notes or terms included in the quote.'),
});
export type QuoteAnalysisInput = z.infer<typeof QuoteAnalysisInputSchema>;

export const QuoteAnalysisOutputSchema = z.object({
  analysis: z
    .string()
    .describe('A single, consolidated text block containing the expert analysis and recommendations for the quote.'),
});
export type QuoteAnalysisOutput = z.infer<typeof QuoteAnalysisOutputSchema>;

export interface Invoice extends QuoteFormData {
  id: string;
  providerId: string;
  subtotal: number;
  itbis: number;
  total: number;
  status: 'sent' | 'paid' | 'overdue';
  createdAt: Timestamp;
}
