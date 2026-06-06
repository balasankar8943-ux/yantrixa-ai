'use client';

import React, { useState } from 'react';
import { Sparkles, Code2, Brain, Bug, Mail, BarChart3, BookOpen } from 'lucide-react';

interface WelcomeScreenProps {
  onSuggestionClick: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    icon: Code2,
    text: 'Write a Python script to sort a list',
    color: '#8b5cf6',
  },
  {
    icon: Brain,
    text: 'Explain quantum computing simply',
    color: '#06b6d4',
  },
  {
    icon: Bug,
    text: 'Help me debug this error',
    color: '#f59e0b',
  },
  {
    icon: Mail,
    text: 'Create a business email template',
    color: '#10b981',
  },
  {
    icon: BarChart3,
    text: 'Analyze this data for trends',
    color: '#ec4899',
  },
  {
    icon: BookOpen,
    text: 'Tell me a creative story',
    color: '#f97316',
  },
];

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div
      className="animate-fadeIn"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '40px 24px',
        textAlign: 'center',
        minHeight: 0,
      }}
    >
      {/* Logo / Icon */}
      <div
        className="animate-float"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '16px',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.15), 0 0 80px rgba(6, 182, 212, 0.1)',
        }}
      >
        <img
          src="/images/logo.png"
          alt="Yantrixa AI"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Heading */}
      <h1
        className="gradient-text"
        style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 700,
          marginBottom: '12px',
          letterSpacing: '-0.02em',
        }}
      >
        Welcome to Yantrixa AI
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          marginBottom: '48px',
          maxWidth: '400px',
        }}
      >
        How can I help you today?
      </p>

      {/* Suggestion Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          width: '100%',
          maxWidth: '640px',
        }}
      >
        {SUGGESTIONS.map((suggestion, index) => (
          <SuggestionCard
            key={index}
            icon={suggestion.icon}
            text={suggestion.text}
            color={suggestion.color}
            onClick={() => onSuggestionClick(suggestion.text)}
            delay={index * 60}
          />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({
  icon: Icon,
  text,
  color,
  onClick,
  delay,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  text: string;
  color: string;
  onClick: () => void;
  delay: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 18px',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${isHovered ? `${color}40` : 'var(--border-color)'}`,
        background: isHovered ? `${color}08` : 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        transition: 'all var(--transition-normal)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? `0 8px 25px ${color}20`
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        animation: `fadeInUp 0.4s ease ${delay}ms both`,
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--transition-normal)',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <span style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
        {text}
      </span>
    </button>
  );
}
