import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const nvidiaClient = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || '',
});

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
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra',
    description: 'Nvidia Reasoning Model',
    icon: '🟢',
  },
  {
    id: 'moonshotai/kimi-k2.6',
    name: 'Kimi K2.6',
    description: 'Moonshot AI Long Context Model',
    icon: '🐉',
  },
];

// ─── Streaming Chat ──────────────────────────────────────────────────────────

import fs from 'fs/promises';
import path from 'path';

export async function* streamChat(
  model: string,
  messages: { role: string; content: string; attachments?: { name: string; type: string; url: string }[] }[]
): AsyncGenerator<{ text?: string; reasoning?: string }> {
  if (model.startsWith('nvidia/') || model.startsWith('moonshotai/')) {
    const completion = (await nvidiaClient.chat.completions.create({
      model,
      messages: messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      extra_body: {
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 16384,
      },
      stream: true,
    } as any)) as any;

    for await (const chunk of completion) {
      if (!chunk.choices || chunk.choices.length === 0) continue;
      const delta = chunk.choices[0].delta as any;
      const reasoning = delta.reasoning_content;
      const content = delta.content;

      if (reasoning) {
        yield { reasoning };
      }
      if (content) {
        yield { text: content };
      }
    }
    return;
  }

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
      yield { text: chunk.text };
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
