import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ─── Available Models ────────────────────────────────────────────────────────

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast & efficient',
    icon: '⚡',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable',
    icon: '🧠',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Quick responses',
    icon: '💨',
  },
];

// ─── Streaming Chat ──────────────────────────────────────────────────────────

import fs from 'fs/promises';
import path from 'path';

export async function* streamChat(
  model: string,
  messages: { role: string; content: string; attachments?: { name: string; type: string; url: string }[] }[]
): AsyncGenerator<string> {
  // Convert messages to Gemini content format with multi-modal support
  const contents = await Promise.all(
    messages.map(async (msg) => {
      const parts: any[] = [];
      
      // Add text content
      if (msg.content) {
        parts.push({ text: msg.content });
      } else {
        // If content is empty but we have attachments, Gemini still needs some text or a non-empty parts array
        parts.push({ text: "" });
      }

      // Add file attachments if present
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          try {
            // att.url is like "/uploads/xxx.png"
            const filePath = path.join(process.cwd(), 'public', att.url);
            const data = await fs.readFile(filePath);
            const base64 = data.toString('base64');
            
            parts.push({
              inlineData: {
                data: base64,
                mimeType: att.type,
              },
            });
          } catch (err) {
            console.error(`Error reading attachment ${att.name}:`, err);
          }
        }
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    })
  );

  const result = await ai.models.generateContentStream({
    model,
    contents,
  });

  for await (const chunk of result) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

// ─── Title Generation ────────────────────────────────────────────────────────

export async function generateTitle(content: string): Promise<string> {
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Generate a very short title (maximum 6 words) for a conversation that starts with this message. Return ONLY the title, no quotes, no punctuation at the end:\n\n${content}`,
            },
          ],
        },
      ],
    });

    const title = result.text?.trim();
    if (title && title.length > 0 && title.length <= 100) {
      return title;
    }
    return 'New Conversation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
}
