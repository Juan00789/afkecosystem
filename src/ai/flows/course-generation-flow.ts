'use server';
/**
 * @fileOverview An AI flow for generating micro-course content.
 *
 * - generateCourse - A function that handles the course generation process.
 * - GenerateCourseInput - The input type for the generateCourse function.
 * - GenerateCourseOutput - The return type for the generateCourse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/googleai';

const GenerateCourseInputSchema = z.object({
  topic: z.string().describe('The topic for the micro-course.'),
});
export type GenerateCourseInput = z.infer<typeof GenerateCourseInputSchema>;

const CourseStepSchema = z.object({
  title: z.string().describe('The title of the course step.'),
  content: z.string().describe('The detailed content of the course step.'),
});

const GenerateCourseOutputSchema = z.object({
  title: z.string().describe('The overall title of the generated course.'),
  description: z.string().describe('A brief description of the course.'),
  steps: z.array(CourseStepSchema).min(3).max(7).describe('An array of 3 to 7 steps for the course.'),
});
export type GenerateCourseOutput = z.infer<typeof GenerateCourseOutputSchema>;


export async function generateCourse(
  input: GenerateCourseInput,
): Promise<GenerateCourseOutput> {
  return generateCourseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoursePrompt',
  input: { schema: GenerateCourseInputSchema },
  output: { schema: GenerateCourseOutputSchema },
  prompt: `You are an expert curriculum designer specializing in creating concise, actionable micro-courses for entrepreneurs.

Generate a micro-course based on the following topic:
**Topic:** {{{topic}}}

The course should have a clear title, a short description, and between 3 and 7 practical steps. Each step must have a title and content.
The tone should be encouraging, clear, and directly applicable. Assume the learner is a busy micro-entrepreneur.
Focus on a "Lean Startup" or "bootstrapped" approach in your content.
`,
});

const generateCourseFlow = ai.defineFlow(
  {
    name: 'generateCourseFlow',
    inputSchema: GenerateCourseInputSchema,
    outputSchema: GenerateCourseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
