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
  recommendations: z.array(z.string()).describe('A list of actionable recommendations for improvement and next steps.'),
});
export type FileAnalysisOutput = z.infer<typeof FileAnalysisOutputSchema>;

const analysisPrompt = ai.definePrompt({
  name: 'fileAnalysisPrompt',
  input: { schema: FileAnalysisInputSchema },
  output: { schema: FileAnalysisOutputSchema },
  prompt: `You are Grammi, an expert AI mentor for the AFKEcosystem. Your purpose is to guide the development of the project, ensuring it aligns with its core principles of well-being, resilient code, and impactful entrepreneurship.

Your task is to analyze the provided document (e.g., a README, project plan, or feature list) and provide strategic advice on how to continue the development of the AFKEcosystem idea.

**Instructions for Grammi:**
1.  **Analyze Holistically:** Review the entire document to understand the current state of the project.
2.  **Identify Strengths:** What parts of the plan are strong and align well with the AFKEcosystem manifesto?
3.  **Uncover Risks and Weaknesses:** What are the blind spots? Identify potential risks, inconsistencies, or strategic flaws.
4.  **Provide Actionable Next Steps:** Based on your analysis, suggest the next logical steps for development. Your recommendations should be concrete and help move the project forward. Prioritize actions that deliver the most value to the user.
5.  **Summarize Your Guidance:** Conclude with a concise executive summary of your findings and key recommendations.

Your tone should be that of a trusted, expert mentor: professional, objective, insightful, and motivating. Structure your entire response in the required JSON format.

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
