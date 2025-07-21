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
import type { UserProfile } from '@/modules/auth/types';

const ValidateCourseInputSchema = z.object({
  title: z.string().describe('The title of the course to validate.'),
  description: z.string().describe('The description of the course to validate.'),
  providerProfile: z.custom<UserProfile>().describe('The profile of the course creator.'),
});
export type ValidateCourseInput = z.infer<typeof ValidateCourseInputSchema>;

const ValidateCourseOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the course content is valid (unique and not toxic).'),
  isKnowledgeable: z.boolean().describe('Whether the creator seems knowledgeable on the topic.'),
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
      providerProfileJson: z.string(),
    }),
  },
  output: { schema: ValidateCourseOutputSchema },
  prompt: `You are a strict but fair content and expertise moderator for an educational platform for entrepreneurs. Your task is to validate new course submissions based on three criteria: uniqueness, content safety, and creator's knowledge.

**New Course Submission:**
- **Title:** {{{title}}}
- **Description:** {{{description}}}

**Creator's Profile (JSON format):**
{{{providerProfileJson}}}

**Existing Courses on the Platform (JSON format):**
{{{existingCoursesJson}}}

**Instructions:**

1.  **Uniqueness Check:** Compare the new course's title and description with the list of existing courses. The new course should be considered a duplicate if its topic and core concepts are substantively identical to an existing one. It is NOT a duplicate if it covers a similar topic from a different angle.

2.  **Content Safety Check:** Review the title and description for any toxic, harmful, inappropriate, hateful, or explicit content.

3.  **Knowledge Check:** Based on the creator's profile (especially companyName, services they offer, or past projects if available), determine if they seem knowledgeable about the course topic. For example, someone with "Marketing Digital" in their profile is knowledgeable to teach about "SEO Básico". Someone with a profile focused on "Diseño de Modas" is likely NOT knowledgeable to teach "Contabilidad para Startups". Be strict; if there's no clear evidence of expertise, set \`isKnowledgeable\` to \`false\`.

**Validation Logic:**

- If the creator does not seem knowledgeable, set \`isKnowledgeable\` to \`false\` and provide a reason like "The creator's profile does not show expertise in this topic. Please update your profile or choose a topic you are an expert in." In this case, \`isValid\` should also be \`false\`.
- If the course is a clear duplicate, set \`isValid\` to \`false\` and provide a \`reason\` like: "This course topic seems to be a duplicate of an existing course."
- If the content is inappropriate or toxic, set \`isValid\` to \`false\` and provide a \`reason\` like: "The course content does not align with our community guidelines."
- If the course passes ALL checks, set \`isValid\` and \`isKnowledgeable\` to \`true\` and \`reason\` to an empty string.

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
    const providerProfileJson = JSON.stringify(input.providerProfile, null, 2);

    const { output } = await prompt({
      title: input.title,
      description: input.description,
      existingCoursesJson,
      providerProfileJson,
    });

    return output!;
  },
);
