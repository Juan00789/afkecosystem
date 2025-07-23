'use server';
/**
 * @fileOverview An AI flow for performing an expert audit on arbitrary file content.
 *
 * - analyzeFileContent - A function that takes file content and a query, and returns an expert audit.
 * - FileAnalysisInput - The input type for the analysis.
 * - FileAnalysisOutput - The return type for the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FileAnalysisInputSchema = z.object({
  fileName: z.string().describe('The name of the file being audited.'),
  fileContent: z
    .string()
    .describe(
      "The content of the file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userQuery: z.string().describe('The specific question or type of audit the user wants.'),
});
export type FileAnalysisInput = z.infer<typeof FileAnalysisInputSchema>;

const FileAnalysisOutputSchema = z.object({
  summary: z.string().describe('An executive summary of the audit findings.'),
  strengths: z.array(z.string()).describe('A list of key strengths or well-implemented aspects.'),
  risks: z.array(z.string()).describe('A list of identified risks, weaknesses, or areas of concern.'),
  recommendations: z.array(z.string()).describe('A list of actionable recommendations for improvement.'),
});
export type FileAnalysisOutput = z.infer<typeof FileAnalysisOutputSchema>;

const analysisPrompt = ai.definePrompt({
  name: 'fileAnalysisPrompt',
  input: { schema: FileAnalysisInputSchema },
  output: { schema: FileAnalysisOutputSchema },
  prompt: `You are Oniara, a world-class auditor and risk assessment expert. Your task is to perform a detailed audit of the provided file based on the user's request.

**User's Request for Audit:**
"{{{userQuery}}}"

**File to Analyze (Name: {{{fileName}}}):**
{{media url=fileContent}}

**Instructions:**
1.  **Analyze from an Auditor's Perspective:** Meticulously examine the file content, focusing on identifying strengths, weaknesses, opportunities, and threats (SWOT) in the context of the user's query.
2.  **Formulate an Expert Opinion:** Develop a professional audit based on your findings.
3.  **Create a Summary:** Write a concise executive summary of your audit.
4.  **Identify Key Strengths:** List the most significant positive aspects or well-implemented areas.
5.  **Identify Key Risks:** List the most critical risks, inconsistencies, or areas needing improvement.
6.  **Provide Actionable Recommendations:** Offer clear, prioritized, and practical recommendations to mitigate risks and enhance strengths.

Structure your entire response in the required JSON format. Your tone should be objective, professional, and constructive, providing high-value feedback that helps the user make informed decisions.`,
});

export async function analyzeFileContent(input: FileAnalysisInput): Promise<FileAnalysisOutput> {
  const { output } = await analysisPrompt(input);
  if (!output) {
    throw new Error('Failed to get analysis from the model.');
  }
  return output;
}
