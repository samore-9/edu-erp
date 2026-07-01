// src/components/common/NotificationBell.js
import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';

const typeIcon = {
  info:         { icon: 'bi-info-circle-fill',     color: 'var(--info)' },
  warning:      { icon: 'bi-exclamation-triangle-fill', color: 'var(--warning)' },
  success:      { icon: 'bi-check-circle-fill',    color: 'var(--success)' },
  danger:       { icon: 'bi-x-circle-fill',        color: 'var(--danger)' },
  announcement: { icon: 'bi-megaphone-fill',       color: 'var(--accent)' },
};

export default function NotificationBell() {
  const [open, setOpen]           = useState(false);
  const [notifications, setNotifs] = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const dropRef                   = useRef(null);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=15');
      setNotifs(data.data || []);
      setUnread(data.unreadCount || 0);
    } catch (e) { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifs();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (e) { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (e) { /* ignore */ }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifs(); }}
        style={{
          position: 'relative', background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
          color: 'white', width: 36, height: 36, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      >
        <i className="bi bi-bell-fill" style={{ fontSize: '0.95rem' }}></i>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--danger)', color: 'white',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: '0.65rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--primary)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0, width: 360,
          background: 'white', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid var(--border)', zIndex: 2000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>Notifications</span>
              {unread > 0 && (
                <span style={{ marginLeft: 8, background: 'var(--danger)', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', color: 'var(--primary-light)',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-4"><div className="spinner-border spinner-border-sm" style={{ color: 'var(--primary-light)' }}></div></div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
                <i className="bi bi-bell-slash" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>
                No notifications yet
              </div>
            ) : notifications.map(n => {
              const meta = typeIcon[n.type] || typeIcon.info;
              return (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markRead(n._id)}
                  style={{
                    padding: '12px 18px', borderBottom: '1px solid #f0f4f8',
                    background: n.isRead ? 'white' : '#f0f7ff',
                    cursor: n.isRead ? 'default' : 'pointer',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!n.isRead) e.currentTarget.style.background = '#e8f2ff'; }}
                  onMouseLeave={e => { if (!n.isRead) e.currentTarget.style.background = '#f0f7ff'; }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: `${meta.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: '1rem' }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.3 }}>
                      {n.pinned && <i className="bi bi-pin-fill me-1" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}></i>}
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 8 }}>
                      <span>{timeAgo(n.createdAt)}</span>
                      {n.createdBy?.name && <span>• {n.createdBy.name}</span>}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)', flexShrink: 0, marginTop: 4 }}></div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', background: '#fafbfc', textAlign: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Showing latest {notifications.length} notifications
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
