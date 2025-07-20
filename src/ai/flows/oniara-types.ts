/**
 * @fileOverview Types and schemas for the Oniara AI flow.
 */
import { z } from 'genkit';

export const ChatWithOniaraHistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })
);

export type ChatWithOniaraHistory = z.infer<
  typeof ChatWithOniaraHistorySchema
>;
