import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from './Icon';

export interface Notification {
  id: string;
  type: 'achievement' | 'reply' | 'xp' | 'streak' | 'system' | 'level';
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

const TYPE_META: Record<Notification['type'], { icon: string; color: string; bg: string }> = {
  achievement: { icon: 'emoji_events', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  reply:       { icon: 'chat_bubble', color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  xp:          { icon: 'bolt',        color: 'text-primary-container', bg: 'bg-red-500/10' },
  streak:      { icon: 'local_fire_department', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  level:       { icon: 'trending_up', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  system:      { icon: 'info',        color: 'text-zinc-400',   bg: 'bg-zinc-500/10' },
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

interface Props {
  readonly notifications: Notification[];
  readonly onClose: () => void;
  readonly onMarkAllRead: () => void;
  readonly onMarkRead: (id: string) => void;
}

export function NotificationsPanel({ notifications, onClose, onMarkAllRead, onMarkRead }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && e.target instanceof Node && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[380px] rounded-2xl z-50 overflow-hidden"
      style={{
        background: 'rgba(8,8,8,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(32px) saturate(160%)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
      initial={{ opacity: 0, y: -8, scale: 0.97, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top red accent */}
      <div style={{
        height: 1, background: 'linear-gradient(90deg, transparent, rgba(232,25,44,0.6) 40%, rgba(232,25,44,0.2) 70%, transparent)',
      }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-on-surface">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-black bg-primary-container text-white rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <Icon name="close" size={18} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="notifications_none" size={36} className="text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500 font-bold">You're all caught up!</p>
            <p className="text-xs text-zinc-600 mt-1">New activity will show up here.</p>
          </div>
        ) : (
          notifications.map((n, i) => {
            const meta = TYPE_META[n.type];
            const Wrapper = (n.href ? Link : 'div') as React.ElementType;
            const wrapperProps = n.href ? { to: n.href } : {};
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}
              >
                <Wrapper
                  {...wrapperProps}
                  onClick={() => { onMarkRead(n.id); if (n.href) onClose(); }}
                  className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors ${
                    n.read ? 'opacity-50 hover:opacity-70' : 'hover:bg-white/[0.03]'
                  }`}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon name={meta.icon} className={meta.color} size={18} filled={n.type === 'xp' || n.type === 'streak'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-bold leading-snug ${n.read ? 'text-zinc-400' : 'text-white'}`}>{n.title}</p>
                      {!n.read && (
                        <motion.div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                          style={{ background: '#E82127' }}
                          animate={{ boxShadow: ['0 0 0px rgba(232,25,44,0)', '0 0 8px rgba(232,25,44,0.7)', '0 0 0px rgba(232,25,44,0)'] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-zinc-600 mt-1 font-bold">{timeAgo(n.createdAt)}</p>
                  </div>
                </Wrapper>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-5 py-3 flex items-center justify-center" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Showing last {notifications.length} notifications
          </p>
        </div>
      )}
    </motion.div>
  );
}
