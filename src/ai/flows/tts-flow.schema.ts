'use server';
/**
 * @fileOverview Schema and type definitions for the text-to-speech flow.
 *
 * - TextToSpeechOutputSchema - The Zod schema for the output.
 * - TextToSpeechOutput - The TypeScript type for the output.
 */

import { z } from 'zod';

export const TextToSpeechOutputSchema = z.object({
  media: z.string().describe("The base64 encoded WAV audio data URI."),
});

export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;
