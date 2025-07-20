'use server';
/**
 * @fileOverview An AI assistant flow for Oniara.
 *
 * - chatWithOniara - A function that handles the chat interaction.
 */

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { courseSearchTool } from '@/ai/tools/course-search-tool';
import { courseCreationTool } from '@/ai/tools/course-creation-tool';
import type { ChatWithOniaraHistory, ModelResponse } from './oniara-types';
import { z } from 'zod';

const oniaraPrompt = `You are Oniara, an expert business mentor and the friendly AI assistant for AFKEcosystem. Your mission is to guide and support micro-entrepreneurs.

- Your tone is encouraging, knowledgeable, and slightly informal, like a trusted mentor. Use emojis where appropriate to add warmth.
- Keep your answers concise and actionable.
- You specialize in business strategy, marketing, finance for startups, and local Dominican Republic market trends.
- Use the provided chat history to maintain context and provide relevant, coherent responses.
- **You have two primary tools:**
  1.  **courseSearchTool**: Use this to find relevant existing courses when a user asks about learning, business topics, or seems to need guidance.
  2.  **courseCreationTool**: Use this ONLY when a user explicitly asks you to CREATE a new course for them on a specific topic. You will generate the course structure and present it back to the user for confirmation.
- **If the user provides a file, analyze it in the context of their message. Provide constructive feedback, suggestions for improvement, or a better version of the content as requested. For example, if they upload a logo, critique its design. If they upload a business plan, review its sections.**
- If a user's question is outside your expertise and you can't find a relevant course, be honest and suggest they consult a human expert or use other platform features like forums.
`;

export async function chatWithOniara(
  history: ChatWithOniaraHistory,
  newMessage: string,
  fileDataUri?: string,
): Promise<ModelResponse> {
  const promptParts: z.infer<typeof gemini15Flash.schema.prompt> = [{ text: newMessage }];
  if (fileDataUri) {
    promptParts.push({ media: { url: fileDataUri } });
  }
  
  const llmResponse = await ai.generate({
    model: gemini15Flash,
    prompt: promptParts,
    system: oniaraPrompt,
    history: history.map((msg) => {
      let content: z.infer<typeof gemini15Flash.schema.content>;
      if (msg.role === 'user') {
          content = [{ text: msg.content.text }];
      } else { // 'model'
          if(msg.content.type === 'course') {
            // We simplify the model's history by just showing it generated a course.
            // This prevents confusion in subsequent turns.
            content = [{text: `I have generated a course titled "${msg.content.course.title}".`}]
          } else {
            content = [{ text: msg.content.text }];
          }
      }
      return { role: msg.role, content };
    }),
    tools: [courseSearchTool, courseCreationTool],
  });

  const toolCalls = llmResponse.toolCalls(courseCreationTool);

  if (toolCalls && toolCalls.length > 0) {
    const courseData = toolCalls[0].output;
    return { type: 'course', course: courseData };
  }
  
  return { type: 'text', text: llmResponse.text };
}
