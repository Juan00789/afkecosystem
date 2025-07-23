'use server';
/**
 * @fileOverview An AI flow for analyzing the sentiment of case comments.
 *
 * - analyzeCaseSentiment - A function that analyzes comments and returns a sentiment.
 * - CaseSentimentInput - The input type for the analysis.
 * - CaseSentimentOutput - The return type for the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CaseCommentSchema = z.object({
  authorName: z.string(),
  text: z.string(),
});

const CaseSentimentInputSchema = z.object({
  caseTitle: z.string().describe('The title of the case being analyzed.'),
  comments: z.array(CaseCommentSchema).describe('The list of comments in the case thread.'),
});
export type CaseSentimentInput = z.infer<typeof CaseSentimentInputSchema>;

const CaseSentimentOutputSchema = z.object({
  sentiment: z.enum(['Positivo', 'Neutral', 'Negativo', 'Conflicto Potencial']).describe('The overall sentiment of the conversation.'),
  summary: z.string().describe('A brief summary explaining the sentiment, highlighting key interactions.'),
  keyPositivePoints: z.array(z.string()).optional().describe('Specific positive comments or interactions.'),
  keyNegativePoints: z.array(z.string()).optional().describe('Specific negative comments or areas of friction.'),
});
export type CaseSentimentOutput = z.infer<typeof CaseSentimentOutputSchema>;

const sentimentAnalysisPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: { schema: CaseSentimentInputSchema },
  output: { schema: CaseSentimentOutputSchema },
  prompt: `You are Oniara, an expert business mentor with high emotional intelligence. Your task is to analyze the sentiment of a conversation within a project case between a client and a provider.

**Case Title:**
"{{{caseTitle}}}"

**Conversation History:**
{{#each comments}}
- **{{authorName}}:** "{{text}}"
{{/each}}

**Instructions:**
1.  Read through the entire conversation.
2.  Determine the overall emotional tone and sentiment. The possible sentiments are: 'Positivo', 'Neutral', 'Negativo', 'Conflicto Potencial'.
    -   **Positivo**: The conversation is constructive, collaborative, and moving forward.
    -   **Neutral**: The conversation is purely transactional or informational.
    -   **Negativo**: There's clear frustration, disagreement, or dissatisfaction from one or both parties.
    -   **Conflicto Potencial**: The tone is becoming tense, there are misunderstandings, or signs of future disagreement. This is a critical warning flag.
3.  Write a concise summary (2-3 sentences) explaining your sentiment assessment.
4.  If applicable, list the key positive or negative points that support your analysis.

Provide your response in the required JSON format. Be objective and base your analysis solely on the provided text.`,
});


export async function analyzeCaseSentiment(input: CaseSentimentInput): Promise<CaseSentimentOutput> {
  const { output } = await sentimentAnalysisPrompt(input);
  if (!output) {
    throw new Error('Failed to get sentiment analysis output from the model.');
  }
  return output;
}
