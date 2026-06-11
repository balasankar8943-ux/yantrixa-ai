import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  addMessage,
  createConversation,
  getConversation,
} from '@/lib/store';
import { streamChat, generateTitle } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, message, model, attachments } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const selectedModel = model || 'gemini-2.5-flash';
    const userId = "default-user";
    let activeConversationId = conversationId;

    // If no conversationId, create a new conversation
    if (!activeConversationId) {
      const conversation = await createConversation(
        userId,
        'New Conversation',
        selectedModel
      );
      activeConversationId = conversation.id;
    } else {
      // Verify conversation belongs to user
      const conversation = await getConversation(activeConversationId);
      if (!conversation || conversation.userId !== userId) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    }

    // Add user message to conversation
    await addMessage(activeConversationId, {
      role: 'user',
      content: message.trim(),
      model: selectedModel,
      attachments,
    });

    // Build message history for Gemini
    const conversation = await getConversation(activeConversationId);
    const chatMessages = (conversation?.messages || []).map((msg) => ({
      role: msg.role,
      content: msg.content,
      attachments: msg.attachments,
    }));

    // Create streaming response
    const finalConversationId = activeConversationId;
    const isFirstMessage = (conversation?.messages.length || 0) <= 1;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = '';
        let fullReasoning = '';

        try {

          for await (const chunk of streamChat(selectedModel, chatMessages)) {
            if (chunk.reasoning) {
              fullReasoning += chunk.reasoning;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ reasoning: chunk.reasoning })}\n\n`)
              );
            }
            if (chunk.text) {
              fullResponse += chunk.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`)
              );
            }
          }

          // Save the full assistant message to the conversation
          await addMessage(finalConversationId, {
            role: 'assistant',
            content: fullResponse,
            reasoning: fullReasoning || undefined,
            model: selectedModel,
          });

          // Auto-generate title from first message
          if (isFirstMessage) {
            try {
              const title = await generateTitle(message.trim());
              const { updateConversation } = await import('@/lib/store');
              await updateConversation(finalConversationId, { title });
            } catch (titleError) {
              console.error('Error generating title:', titleError);
            }
          }

          // Send done signal
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                conversationId: finalConversationId,
              })}\n\n`
            )
          );
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: 'An error occurred while generating a response',
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Conversation-Id': finalConversationId,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
