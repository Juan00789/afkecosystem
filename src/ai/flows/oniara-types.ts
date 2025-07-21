/**
 * @fileOverview Types and schemas for the Oniara AI flow.
 */
import { z } from 'genkit';
import type { GenerateQuoteOutput } from './quote-flow';

export interface GeneratedCourse {
  title: string;
  description: string;
  coverImageUrl?: string;
  steps: Array<{
    title: string;
    content: string;
  }>;
}

export type ModelResponse = 
  | { type: 'text'; text: string }
  | { type: 'course'; course: GeneratedCourse }
  | { type: 'quote'; quote: GenerateQuoteOutput };
  
export interface Message {
    role: 'user' | 'model';
    content: ModelResponse;
}

export type ChatWithOniaraHistory = Message[];

export interface ProviderInfo {
    name: string;
    bankDetails?: string;
}
