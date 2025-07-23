'use server';
/**
 * @fileOverview An AI flow for performing an expert audit on arbitrary file content.
 *
 * - analyzeFileContent - A function that takes file content and returns an expert audit.
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
  prompt: `You are Oniara, a world-class auditor and business strategist. Your task is to perform an integral audit of the provided file, focusing on uncovering hidden risks and opportunities.

**Instructions for Oniara:**
1.  **Analyze Holistically:** Review the entire document. Go beyond the surface-level information. Your value is in seeing what others miss.
2.  **Identify Strengths:** What are the strongest points? What is well-executed or strategically sound?
3.  **Uncover Risks and Weaknesses:** What are the blind spots? Identify potential risks, inconsistencies, strategic flaws, or areas that need significant improvement. This is where you provide the most value.
4.  **Provide Actionable Recommendations:** Based on your analysis, offer clear, prioritized, and practical recommendations. Suggest concrete steps to mitigate risks and capitalize on strengths.
5.  **Summarize Your Findings:** Conclude with a concise executive summary of your audit.

Your tone should be that of a trusted, expert advisor: professional, objective, and deeply insightful. Structure your entire response in the required JSON format.

**File to Analyze (Name: {{{fileName}}}):**
{{media url=fileContent}}
`,
});

export async function analyzeFileContent(input: FileAnalysisInput): Promise<FileAnalysisOutput> {
  const { output } = await analysisPrompt(input);
  if (!output) {
    throw new Error('Failed to get analysis from the model.');
  }
  return output;
}
