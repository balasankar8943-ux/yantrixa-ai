'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeScreen from '@/components/WelcomeScreen';
import ChatInput from '@/components/ChatInput';

export default function NewChatPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [isLoading, setIsLoading] = useState(false);

  // Load default model from localStorage if present
  useEffect(() => {
    const savedModel = localStorage.getItem('yantrixa_default_model');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('yantrixa_default_model', model);
  };

  const handleSend = async (message: string, attachments?: File[]) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Create new conversation
      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: message.substring(0, 40) + (message.length > 40 ? '...' : ''),
          model: selectedModel,
        }),
      });

      if (!convRes.ok) {
        throw new Error('Failed to create conversation');
      }

      const { conversation } = await convRes.json();

      // If we have attachments, upload them first
      let uploadedAttachments: any[] = [];
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            uploadedAttachments.push(data);
          }
        }
      }

      // Redirect to the conversation page and pass the initial prompt & attachments via session/state or simple search parameters
      // Since passing large objects via URL is not ideal, we can save them in sessionStorage temporarily
      if (uploadedAttachments.length > 0) {
        sessionStorage.setItem(`pending_attachments_${conversation.id}`, JSON.stringify(uploadedAttachments));
      }
      
      router.push(`/chat/${conversation.id}?prompt=${encodeURIComponent(message)}&model=${selectedModel}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        background: '#050508',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <WelcomeScreen onSuggestionClick={(prompt) => handleSend(prompt)} />
      </div>
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />
    </div>
  );
}
