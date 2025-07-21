'use server';
/**
 * @fileOverview An AI flow for validating course content for uniqueness and safety.
 *
 * - validateCourse - A function that handles the course validation process.
 * - ValidateCourseInput - The input type for the validateCourse function.
 * - ValidateCourseOutput - The return type for the validateCourse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ValidateCourseInputSchema = z.object({
  title: z.string().describe('The title of the course to validate.'),
  description: z.string().describe('The description of the course to validate.'),
});
export type ValidateCourseInput = z.infer<typeof ValidateCourseInputSchema>;

const ValidateCourseOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the course content is valid (unique and not toxic).'),
  reason: z.string().describe('The reason why the course is not valid. Empty if it is valid.'),
});
export type ValidateCourseOutput = z.infer<typeof ValidateCourseOutputSchema>;

// Helper function to fetch existing courses
async function getExistingCourses(): Promise<{ title: string; description: string }[]> {
  const coursesSnapshot = await getDocs(collection(db, 'courses'));
  return coursesSnapshot.docs.map(doc => ({
    title: doc.data().title,
    description: doc.data().description,
  }));
}

export async function validateCourse(
  input: ValidateCourseInput,
): Promise<ValidateCourseOutput> {
  return validateCourseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateCoursePrompt',
  input: {
    schema: z.object({
      title: z.string(),
      description: z.string(),
      existingCoursesJson: z.string(),
    }),
  },
  output: { schema: ValidateCourseOutputSchema },
  prompt: `You are a content moderator for an educational platform for entrepreneurs. Your task is to validate new course submissions based on two criteria: uniqueness and content safety.

**New Course Submission:**
- **Title:** {{{title}}}
- **Description:** {{{description}}}

**Existing Courses on the Platform (JSON format):**
{{{existingCoursesJson}}}

**Instructions:**

1.  **Uniqueness Check:** Compare the new course's title and description with the list of existing courses. The new course should be considered a duplicate if its topic and core concepts are substantively identical to an existing one, even if the wording is slightly different. It is NOT a duplicate if it covers a similar topic from a different angle or for a different audience.

2.  **Content Safety Check:** Review the title and description for any toxic, harmful, inappropriate, hateful, or explicit content. The platform promotes a positive and professional environment.

**Validation Logic:**

- If the course is a clear duplicate, set \`isValid\` to \`false\` and provide a \`reason\` like: "This course topic seems to be a duplicate of an existing course. Please choose a more unique topic or angle."
- If the content is inappropriate or toxic, set \`isValid\` to \`false\` and provide a \`reason\` like: "The course content does not align with our community guidelines. Please revise the content."
- If the course is both a duplicate and toxic, prioritize the toxicity reason.
- If the course passes both checks, set \`isValid\` to \`true\` and \`reason\` to an empty string.

Provide your response in the required JSON format.`,
});

const validateCourseFlow = ai.defineFlow(
  {
    name: 'validateCourseFlow',
    inputSchema: ValidateCourseInputSchema,
    outputSchema: ValidateCourseOutputSchema,
  },
  async (input) => {
    const existingCourses = await getExistingCourses();
    const existingCoursesJson = JSON.stringify(existingCourses, null, 2);

    const { output } = await prompt({
      ...input,
      existingCoursesJson,
    });

    return output!;
  },
);
