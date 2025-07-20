'use server';
/**
 * @fileOverview A Genkit tool for searching courses in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Course {
  id: string;
  title: string;
  description: string;
}

export const courseSearchTool = ai.defineTool(
  {
    name: 'courseSearchTool',
    description: 'Searches for available courses on the platform based on a query.',
    inputSchema: z.object({
      query: z.string().describe('The topic or keyword to search for in course titles and descriptions.'),
    }),
    outputSchema: z.object({
      courses: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
        })
      ),
    }),
  },
  async (input) => {
    console.log(`Searching for courses with query: ${input.query}`);
    
    // In a real-world scenario with many courses, you'd use a more advanced
    // search service like Algolia or Firestore's vector search.
    // For this prototype, we'll fetch all courses and filter in memory.
    const coursesRef = collection(db, 'courses');
    const coursesSnapshot = await getDocs(query(coursesRef));
    
    const allCourses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Course));

    const lowerCaseQuery = input.query.toLowerCase();

    const filteredCourses = allCourses.filter(course => 
        course.title.toLowerCase().includes(lowerCaseQuery) ||
        course.description.toLowerCase().includes(lowerCaseQuery)
    );

    return {
      courses: filteredCourses.map(c => ({ title: c.title, description: c.description })),
    };
  }
);
