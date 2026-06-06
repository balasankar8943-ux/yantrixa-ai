'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import MessageBubble from '@/components/MessageBubble';
import ChatInput from '@/components/ChatInput';

interface MessageAttachment {
  name: string;
  type: string;
  url: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  attachments?: MessageAttachment[];
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialSendTriggered = useRef(false);

  // Fetch existing messages
  useEffect(() => {
    async function loadConversation() {
      try {
        setError(null);
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push('/chat');
            return;
          }
          throw new Error('Failed to load conversation');
        }
        const data = await res.json();
        setMessages(data.conversation.messages || []);
        setSelectedModel(data.conversation.model || 'gemini-2.5-flash');
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading');
      }
    }
    loadConversation();
  }, [conversationId, router]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Handle redirected prompt from New Chat screen
  useEffect(() => {
    if (messages.length === 0 && !isLoading && !isInitialSendTriggered.current) {
      const prompt = searchParams.get('prompt');
      const model = searchParams.get('model');

      if (prompt) {
        isInitialSendTriggered.current = true;
        
        // Retrieve any pending attachments
        let attachments: any[] = [];
        try {
          const key = `pending_attachments_${conversationId}`;
          const saved = sessionStorage.getItem(key);
          if (saved) {
            attachments = JSON.parse(saved);
            sessionStorage.removeItem(key);
          }
        } catch (e) {
          console.error('Failed to parse pending attachments:', e);
        }

        // Clean up URL parameters
        const newUrl = `/chat/${conversationId}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);

        // Send the prompt
        handleSend(prompt, attachments, model || selectedModel);
      }
    }
  }, [messages, searchParams, conversationId, isLoading, selectedModel]);

  const handleSend = async (content: string, attachmentsList?: any[], overrideModel?: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const modelToUse = overrideModel || selectedModel;

    // Prepare attachments to send to API
    const attachments = attachmentsList || [];

    // Add user message locally
    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      attachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: content,
          model: modelToUse,
          attachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream returned');
      }

      const decoder = new TextDecoder();
      let currentStreamingText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        const lines = chunkText.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.text) {
              currentStreamingText += data.text;
              setStreamingContent(currentStreamingText);
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error('Error parsing SSE line:', e);
          }
        }
      }

      // Streaming finished: add final message to state and reset stream container
      const finalAssistantMessage: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: currentStreamingText,
        timestamp: new Date().toISOString(),
        model: modelToUse,
      };

      setMessages((prev) => [...prev, finalAssistantMessage]);
      setStreamingContent('');

      // Refresh sidebar list
      window.dispatchEvent(new Event('refresh-conversations'));
    } catch (err: any) {
      setError(err.message || 'An error occurred during chat streaming');
    } finally {
      setIsLoading(false);
    }
  };

  const onChatInputSend = async (content: string, attachments?: File[]) => {
    let uploadedAttachments: any[] = [];
    
    // If there are files, upload them first
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            uploadedAttachments.push(data);
          }
        } catch (uploadErr) {
          console.error('Error uploading file:', uploadErr);
        }
      }
    }

    handleSend(content, uploadedAttachments);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#050508',
      }}
    >
      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
          {error && (
            <div
              className="animate-fadeIn"
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                marginBottom: '16px',
                fontSize: '0.9rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Assistant streaming bubble */}
          {isLoading && (
            <MessageBubble
              message={{
                id: 'streaming-assistant',
                role: 'assistant',
                content: streamingContent,
                timestamp: new Date().toISOString(),
                model: selectedModel,
              }}
              isStreaming={true}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput
        onSend={onChatInputSend}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}
