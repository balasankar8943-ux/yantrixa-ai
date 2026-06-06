'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Sun, Moon, Monitor, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash ⚡' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro 🧠' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash 💨' },
];

type ThemeMode = 'dark' | 'light' | 'system';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [defaultModel, setDefaultModel] = useState('gemini-2.5-flash');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedTheme = localStorage.getItem('yantrixa-theme') as ThemeMode;
      const savedModel = localStorage.getItem('yantrixa-default-model');
      const savedPrompt = localStorage.getItem('yantrixa-system-prompt');
      if (savedTheme) setTheme(savedTheme);
      if (savedModel) setDefaultModel(savedModel);
      if (savedPrompt) setSystemPrompt(savedPrompt);
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSave = useCallback(() => {
    setSaving(true);
    localStorage.setItem('yantrixa-theme', theme);
    localStorage.setItem('yantrixa-default-model', defaultModel);
    localStorage.setItem('yantrixa-system-prompt', systemPrompt);

    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);

    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 300);
  }, [theme, defaultModel, systemPrompt, onClose]);

  const handleClearConversations = async () => {
    try {
      await fetch('/api/conversations', { method: 'DELETE' });
      setShowDeleteConfirm(false);
      window.location.href = '/chat';
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { value: 'light', label: 'Light', icon: <Sun size={16} /> },
    { value: 'system', label: 'System', icon: <Monitor size={16} /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="animate-fadeIn"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
        }}
      />

      {/* Modal */}
      <div
        className="animate-scaleIn"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '480px',
          maxHeight: '85vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          {/* Appearance */}
          <section>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Appearance
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                padding: '4px',
              }}
            >
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background:
                      theme === opt.value
                        ? 'rgba(139, 92, 246, 0.2)'
                        : 'transparent',
                    color:
                      theme === opt.value
                        ? 'var(--accent-primary)'
                        : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: theme === opt.value ? 600 : 400,
                    transition: 'all var(--transition-fast)',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (theme !== opt.value) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== opt.value) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Default Model */}
          <section>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Default Model
            </h3>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b6b80' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
                paddingRight: '36px',
              }}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </section>

          {/* System Prompt */}
          <section>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Custom System Prompt
            </h3>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter custom instructions for the AI..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.5',
                minHeight: '80px',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-active)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '6px',
              }}
            >
              Saved locally. These instructions will be sent with every message.
            </p>
          </section>

          {/* Data */}
          <section>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Data
            </h3>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <Trash2 size={16} />
                Clear All Conversations
              </button>
            ) : (
              <div
                className="animate-fadeIn"
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.05)',
                }}
              >
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                  }}
                >
                  Are you sure? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleClearConversations}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                    }}
                  >
                    Delete All
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--accent-gradient)',
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all var(--transition-fast)',
              boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)',
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(139, 92, 246, 0.3)';
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}
