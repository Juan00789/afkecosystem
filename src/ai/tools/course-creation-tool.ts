'use server';
/**
 * @fileOverview A Genkit tool for creating a micro-course.
 */
import { ai } from '@/ai/genkit';
import { generateCourse } from '@/ai/flows/course-generation-flow';
import { z } from 'genkit';

export const courseCreationTool = ai.defineTool(
  {
    name: 'courseCreationTool',
    description: 'Generates a new micro-course based on a specified topic. Use this when a user explicitly asks to create a course.',
    inputSchema: z.object({
      topic: z.string().describe('The topic for the new course.'),
    }),
    outputSchema: z.object({
      title: z.string(),
      description: z.string(),
      steps: z.array(
        z.object({
          title: z.string(),
          content: z.string(),
        })
      ),
    }),
  },
  async (input) => {
    console.log(`Generating a course for topic: ${input.topic}`);
    return await generateCourse(input);
  }
);
