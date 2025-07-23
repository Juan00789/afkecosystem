'use server';
/**
 * @fileOverview An AI flow for analyzing arbitrary file content.
 *
 * - analyzeFileContent - A function that takes file content and a query, and returns an expert opinion.
 * - FileAnalysisInput - The input type for the analysis.
 * - FileAnalysisOutput - The return type for the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FileAnalysisInputSchema = z.object({
  fileName: z.string().describe('The name of the file.'),
  fileContent: z.string().describe('The Base64 encoded content of the file.'),
  userQuery: z.string().describe('The specific question or type of analysis the user wants.'),
});
export type FileAnalysisInput = z.infer<typeof FileAnalysisInputSchema>;

const FileAnalysisOutputSchema = z.object({
  summary: z.string().describe('An executive summary of the analysis.'),
  keyPoints: z.array(z.string()).describe('A list of the most important findings or observations.'),
  recommendations: z.array(z.string()).describe('A list of actionable recommendations based on the analysis.'),
});
export type FileAnalysisOutput = z.infer<typeof FileAnalysisOutputSchema>;

const analysisPrompt = ai.definePrompt({
  name: 'fileAnalysisPrompt',
  input: { schema: FileAnalysisInputSchema },
  output: { schema: FileAnalysisOutputSchema },
  prompt: `You are Oniara, a world-class business consultant, data analyst, and strategist. Your task is to provide an expert opinion on the provided file based on the user's request.

**User's Request:**
"{{{userQuery}}}"

**File Details:**
- **Name:** {{{fileName}}}

**File Content (Base64 Encoded):**
"{{{fileContent}}}"
(The model will natively decode and understand the file content from the base64 string).

**Instructions:**
1.  **Analyze the File:** Carefully examine the content of the file in the context of the user's query. The file could be anything (a business plan, financial data, marketing copy, a legal document, etc.).
2.  **Formulate an Expert Opinion:** Based on your analysis, develop a professional opinion.
3.  **Create a Summary:** Write a concise executive summary of your findings.
4.  **Identify Key Points:** List the most critical observations, strengths, or weaknesses you discovered.
5.  **Provide Actionable Recommendations:** Offer clear, practical, and actionable recommendations based on your analysis.

Structure your entire response in the required JSON format. Be insightful, objective, and provide high-value feedback.`,
});

export async function analyzeFileContent(input: FileAnalysisInput): Promise<FileAnalysisOutput> {
  const { output } = await analysisPrompt(input);
  if (!output) {
    throw new Error('Failed to get analysis from the model.');
  }
  return output;
}
