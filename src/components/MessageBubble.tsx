'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles } from 'lucide-react';
import CodeBlock from './CodeBlock';

interface MessageAttachment {
  name: string;
  type: string;
  url?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  attachments?: MessageAttachment[];
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const isUser = message.role === 'user';

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="animate-fadeInUp"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        padding: '4px 0',
        gap: '12px',
        maxWidth: '100%',
      }}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '4px',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.3)',
          }}
        >
          <Sparkles size={16} color="#fff" />
        </div>
      )}

      <div
        style={{
          maxWidth: isUser ? '75%' : '80%',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Model badge for AI */}
        {!isUser && message.model && (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              padding: '2px 8px',
              borderRadius: '20px',
              fontFamily: 'var(--font-geist-mono)',
            }}
          >
            {message.model}
          </span>
        )}

        {/* Message Bubble */}
        <div
          style={{
            padding: isUser ? '12px 18px' : '16px 20px',
            borderRadius: isUser
              ? '20px 20px 6px 20px'
              : '20px 20px 20px 6px',
            background: isUser
              ? 'var(--accent-gradient)'
              : 'var(--bg-chat-ai)',
            color: isUser ? '#ffffff' : 'var(--text-primary)',
            border: isUser ? 'none' : '1px solid var(--border-color)',
            lineHeight: '1.6',
            fontSize: '0.938rem',
            wordBreak: 'break-word',
            position: 'relative',
            boxShadow: isUser
              ? '0 4px 15px rgba(139, 92, 246, 0.25)'
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Streaming indicator */}
          {isStreaming && !message.content ? (
            <div style={{ display: 'flex', gap: '6px', padding: '4px 0' }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (match) {
                      return (
                        <CodeBlock
                          code={codeString}
                          language={match[1]}
                        />
                      );
                    }

                    return (
                      <CodeBlock code={codeString} inline />
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {/* Streaming cursor */}
              {isStreaming && message.content && (
                <span
                  className="animate-pulse"
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1em',
                    background: 'var(--accent-primary)',
                    marginLeft: '2px',
                    verticalAlign: 'text-bottom',
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {message.attachments.map((att, idx) => (
              <div key={idx}>
                {att.type?.startsWith('image/') && att.url ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    style={{
                      maxWidth: '200px',
                      maxHeight: '150px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      padding: '6px 12px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    📎 {att.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            opacity: showTimestamp ? 1 : 0,
            transition: 'opacity var(--transition-fast)',
            paddingLeft: isUser ? '0' : '4px',
            paddingRight: isUser ? '4px' : '0',
          }}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
