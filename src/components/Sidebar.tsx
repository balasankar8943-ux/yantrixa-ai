'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  X,
} from 'lucide-react';
import SettingsModal from './SettingsModal';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

interface GroupedConversations {
  label: string;
  conversations: Conversation[];
}

function groupConversationsByDate(conversations: Conversation[]): GroupedConversations[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: GroupedConversations[] = [
    { label: 'Today', conversations: [] },
    { label: 'Yesterday', conversations: [] },
    { label: 'Previous 7 Days', conversations: [] },
    { label: 'Older', conversations: [] },
  ];

  conversations.forEach((conv) => {
    const date = new Date(conv.updatedAt || conv.createdAt);
    if (date >= today) {
      groups[0].conversations.push(conv);
    } else if (date >= yesterday) {
      groups[1].conversations.push(conv);
    } else if (date >= weekAgo) {
      groups[2].conversations.push(conv);
    } else {
      groups[3].conversations.push(conv);
    }
  });

  return groups.filter((g) => g.conversations.length > 0);
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const session = { user: { name: 'Guest User', email: 'guest@yantrixa.in' } };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || data || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, pathname]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchConversations();
    };
    window.addEventListener('refresh-conversations', handleRefresh);
    return () => window.removeEventListener('refresh-conversations', handleRefresh);
  }, [fetchConversations]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus edit input
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = groupConversationsByDate(filteredConversations);

  const handleNewChat = () => {
    router.push('/chat');
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c))
      );
    } catch {
      // ignore
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (pathname === `/chat/${id}`) {
        router.push('/chat');
      }
    } catch {
      // ignore
    }
    setMenuOpenId(null);
  };

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const currentChatId = pathname?.match(/\/chat\/(.+)/)?.[1];

  const userName = session?.user?.name || 'User';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Sidebar content
  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '280px',
        background: 'rgba(14, 14, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/images/logo.png"
            alt="Yantrixa AI"
            style={{ width: 32, height: 32, borderRadius: 8 }}
          />
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Yantrixa AI
          </span>
        </div>
        <button
          onClick={() => {
            setIsCollapsed(true);
            setMobileOpen(false);
          }}
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
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div style={{ padding: '12px 12px 8px' }}>
        <button
          onClick={handleNewChat}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--accent-gradient)',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            fontFamily: 'inherit',
            boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(139, 92, 246, 0.3)';
          }}
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '4px 12px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.03)',
            transition: 'border-color var(--transition-fast)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                display: 'flex',
                border: 'none',
                background: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 8px',
        }}
      >
        {grouped.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.label} style={{ marginBottom: '8px' }}>
            <div
              style={{
                padding: '8px 10px 4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {group.label}
            </div>

            {group.conversations.map((conv) => {
              const isActive = currentChatId === conv.id;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  style={{
                    position: 'relative',
                    marginBottom: '2px',
                  }}
                >
                  <div
                    onClick={() => {
                      if (!isEditing) router.push(`/chat/${conv.id}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: isEditing ? 'default' : 'pointer',
                      background: isActive
                        ? 'rgba(139, 92, 246, 0.1)'
                        : 'transparent',
                      border: isActive
                        ? '1px solid rgba(139, 92, 246, 0.2)'
                        : '1px solid transparent',
                      transition: 'all var(--transition-fast)',
                      color: isActive
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <MessageSquare size={16} style={{ flexShrink: 0, opacity: 0.5 }} />

                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(conv.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => handleRename(conv.id)}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontFamily: 'inherit',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          flex: 1,
                          fontSize: '0.85rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conv.title}
                      </span>
                    )}

                    {!isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          flexShrink: 0,
                          opacity: 0.5,
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.5';
                          e.currentTarget.style.background = 'transparent';
                        }}
                        aria-label="Conversation options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    )}
                  </div>

                  {/* Context Menu */}
                  {menuOpenId === conv.id && (
                    <div
                      ref={menuRef}
                      className="animate-scaleIn"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '100%',
                        zIndex: 100,
                        minWidth: '150px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(conv);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '4px',
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
                        <Pencil size={14} />
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conv.id);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          background: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontFamily: 'inherit',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '12px',
        }}
      >
        {/* User Profile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {userInitials || <User size={16} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}
            >
              {session?.user?.email || ''}
            </div>
          </div>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
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
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>

        </div>

        {/* Built by Yantrixa.in */}
        <div style={{ textAlign: 'center', paddingTop: '8px' }}>
          <a
            href="https://yantrixa.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              opacity: 0.6,
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
            }}
          >
            Built by Yantrixa.in
          </a>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: isCollapsed ? '0px' : '280px',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        {!isCollapsed && sidebarContent}
      </div>

      {/* Collapsed Toggle Button (Desktop) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="animate-fadeIn"
          style={{
            position: 'fixed',
            left: '12px',
            top: '16px',
            zIndex: 40,
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-active)';
            e.currentTarget.style.background = 'var(--bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
          aria-label="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Mobile Overlay */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 45,
              backdropFilter: 'blur(4px)',
            }}
            className="animate-fadeIn"
          />
          <div
            className="animate-slideInLeft"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 50,
            }}
          >
            {sidebarContent}
          </div>
        </>
      )}

      {/* Mobile toggle exposed via window for DashboardLayout to access */}
      <input
        type="hidden"
        id="sidebar-mobile-toggle"
        data-mobile-open={mobileOpen}
        data-collapsed={isCollapsed}
        onClick={() => setMobileOpen(!mobileOpen)}
      />
    </>
  );
}

// Export a hook-like approach for the layout to toggle mobile sidebar
export function useSidebarMobileToggle() {
  return {
    toggle: () => {
      const el = document.getElementById('sidebar-mobile-toggle');
      if (el) el.click();
    },
  };
}
