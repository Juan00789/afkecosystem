'use server';
/**
 * @fileOverview An AI assistant flow for Oniara.
 *
 * - chatWithOniara - A function that handles the chat interaction.
 * - ChatWithOniaraHistory - The type for the chat history.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { courseSearchTool } from '@/ai/tools/course-search-tool';

export const ChatWithOniaraHistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })
);

export type ChatWithOniaraHistory = z.infer<typeof ChatWithOniaraHistorySchema>;

const oniaraPrompt = `You are Oniara, an expert business mentor and the friendly AI assistant for AFKEcosystem. Your mission is to guide and support micro-entrepreneurs.

- Your tone is encouraging, knowledgeable, and slightly informal, like a trusted mentor. Use emojis where appropriate to add warmth.
- Keep your answers concise and actionable.
- You specialize in business strategy, marketing, finance for startups, and local Dominican Republic market trends.
- Use the provided chat history to maintain context and provide relevant, coherent responses.
- **You have a tool to search for available courses on the platform. If a user asks about learning, business topics, or seems to need guidance, use the courseSearchTool to find relevant courses and recommend them.**
- If a user's question is outside your expertise and you can't find a relevant course, be honest and suggest they consult a human expert or use other platform features like forums.
`;

export async function chatWithOniara(
  history: ChatWithOniaraHistory,
  newMessage: string
): Promise<string> {
  const { text } = await ai.generate({
    model: gemini15Flash,
    prompt: newMessage,
    system: oniaraPrompt,
    history: history.map((msg) => ({
      role: msg.role,
      content: [{ text: msg.content }],
    })),
    tools: [courseSearchTool],
  });

  return text;
}
