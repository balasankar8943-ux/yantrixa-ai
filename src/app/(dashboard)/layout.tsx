'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar, { useSidebarMobileToggle } from '@/components/Sidebar';
import { Menu, Sparkles } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const mobileToggle = useSidebarMobileToggle();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          background: '#050508',
          color: 'var(--text-primary)',
          gap: '16px',
        }}
      >
        <div className="animate-float" style={{ width: 64, height: 64 }}>
          <img
            src="/images/logo.png"
            alt="Yantrixa AI"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(139, 92, 246, 0.1)',
            borderTopColor: 'var(--accent-primary)',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: '#050508', // Pure blackish/dark background as requested
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar (left panel) */}
      <Sidebar />

      {/* Main content area (right panel) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          minWidth: 0,
        }}
      >
        {/* Mobile top header bar */}
        <header
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(10, 10, 15, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 25,
            width: '100%',
          }}
          className="mobile-header"
        >
          <button
            onClick={() => mobileToggle.toggle()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Menu size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/images/logo.png"
              alt="Yantrixa AI"
              style={{ width: 24, height: 24, borderRadius: 4 }}
            />
            <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Yantrixa AI</span>
          </div>

          <div style={{ width: '36px' }} /> {/* spacer */}
        </header>

        {/* Dynamic page content */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {children}
        </main>
      </div>

      {/* Add mobile header visibility styling style block */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
