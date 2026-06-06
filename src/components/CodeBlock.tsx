'use client';

import React, { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  inline?: boolean;
}

export default function CodeBlock({ code, language, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  if (inline) {
    return (
      <code
        style={{
          background: 'rgba(139, 92, 246, 0.15)',
          color: 'var(--accent-secondary)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.875em',
          fontFamily: 'var(--font-geist-mono)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        }}
      >
        {code}
      </code>
    );
  }

  const lineCount = code.split('\n').length;
  const showLineNumbers = lineCount > 5;
  const displayLang = language || 'text';

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        margin: '0.75em 0',
        background: '#1e1e1e',
      }}
      className="animate-fadeIn"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-geist-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {displayLang}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: 'none',
            background: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            color: copied ? '#22c55e' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-geist-sans)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }
          }}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        showLineNumbers={showLineNumbers}
        wrapLines
        customStyle={{
          margin: 0,
          padding: '16px',
          background: '#1e1e1e',
          fontSize: '0.85rem',
          lineHeight: '1.6',
          fontFamily: 'var(--font-geist-mono)',
        }}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: 'rgba(255, 255, 255, 0.2)',
          userSelect: 'none',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
