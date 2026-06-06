'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, X, Loader2, ChevronDown, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  isLoading: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', icon: '⚡' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', icon: '🧠' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', icon: '💨' },
];

export default function ChatInput({
  onSend,
  isLoading,
  selectedModel,
  onModelChange,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 6 * 24; // 6 rows
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  // Close model menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setMessage('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, attachments, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = message.trim().length > 0 && !isLoading;

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '0 16px 24px' }}>
      {/* Model Selector */}
      <div
        ref={modelMenuRef}
        style={{ position: 'relative', marginBottom: '8px', display: 'inline-block' }}
      >
        <button
          onClick={() => setShowModelMenu(!showModelMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-active)';
            e.currentTarget.style.background = 'var(--bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>{currentModel.icon} {currentModel.name}</span>
          <ChevronDown
            size={14}
            style={{
              transform: showModelMenu ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform var(--transition-fast)',
            }}
          />
        </button>

        {/* Dropdown */}
        {showModelMenu && (
          <div
            className="animate-fadeInDown"
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '4px',
              minWidth: '220px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              zIndex: 50,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setShowModelMenu(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background:
                    model.id === selectedModel
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'transparent',
                  color:
                    model.id === selectedModel
                      ? 'var(--accent-primary)'
                      : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (model.id !== selectedModel) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (model.id !== selectedModel) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '1.1em' }}>{model.icon}</span>
                <span>{model.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* File Preview Chips */}
      {attachments.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '8px',
          }}
        >
          {attachments.map((file, index) => (
            <div
              key={index}
              className="animate-scaleIn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span>📎</span>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-xl)',
          border: `1px solid ${isFocused ? 'var(--border-active)' : 'var(--border-color)'}`,
          background: 'var(--bg-secondary)',
          transition: 'all var(--transition-normal)',
          boxShadow: isFocused ? 'var(--shadow-glow)' : 'none',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* File Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.txt,.md,.csv,.json,.py,.js,.ts,.tsx,.jsx,.html,.css"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Message Yantrixa AI..."
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '0.938rem',
            lineHeight: '1.5',
            fontFamily: 'inherit',
            padding: '8px 0',
            maxHeight: `${6 * 24}px`,
            overflow: 'auto',
          }}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: canSend ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
            color: canSend ? '#fff' : 'var(--text-muted)',
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'all var(--transition-fast)',
            flexShrink: 0,
            boxShadow: canSend ? '0 2px 10px rgba(139, 92, 246, 0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (canSend) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            if (canSend) {
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(139, 92, 246, 0.3)';
            }
          }}
          aria-label={isLoading ? 'Loading' : 'Send message'}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} style={{ marginLeft: '2px' }} />
          )}
        </button>
      </div>

      {/* Hint */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginTop: '8px',
          opacity: 0.6,
        }}
      >
        Press Enter to send, Shift + Enter for new line
      </div>
    </div>
  );
}
