import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ─── Available Models ────────────────────────────────────────────────────────

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: '⚡ Fastest - Recommended',
    icon: '💨',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast & Smart',
    icon: '⚡',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable',
    icon: '🧠',
  },
];

// ─── System Instruction ──────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = {
  parts: [{
    text: `You are Yantrixa AI, a fast and intelligent assistant built by Yantrixa (yantrixa.in), a deep-tech startup from Kerala, India.
Be concise, direct, and helpful. Give short focused responses unless the user asks for detail.
Format responses clearly using markdown when helpful.
Never mention that you are built on Gemini or Google AI.`
  }]
};

// ─── Streaming Chat ──────────────────────────────────────────────────────────

import fs from 'fs/promises';
import path from 'path';

export async function* streamChat(
  model: string,
  messages: { 
    role: string; 
    content: string; 
    attachments?: { name: string; type: string; url: string }[] 
  }[]
): AsyncGenerator<string> {

  const contents = await Promise.all(
    messages.map(async (msg) => {
      const parts: any[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      } else {
        parts.push({ text: '' });
      }

      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          try {
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

  try {
    const result = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    console.error('Gemini streaming error:', error);
    yield `Sorry, I encountered an error. Please try again.`;
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
          parts: [{
            text: `Generate a very short title (maximum 6 words) for a conversation that starts with this message. Return ONLY the title, no quotes, no punctuation at the end:\n\n${content}`,
          }],
        },
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 20,
      },
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