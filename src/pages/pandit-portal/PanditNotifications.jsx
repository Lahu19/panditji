/**
 * PanditNotifications — in-app notification center.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { panditPortalApi } from '../../api/panditPortal.js';

const TYPE_ICONS = {
  BOOKING_CONFIRMED:  '✅',
  BOOKING_CANCELLED:  '❌',
  BOOKING_COMPLETED:  '🎉',
  PROVIDER_ACCEPTED:  '✅',
  PROVIDER_DECLINED:  '❌',
  PAYMENT_RECEIVED:   '💰',
  PAYMENT_FAILED:     '⚠️',
  REFUND_INITIATED:   '↩️',
  REVIEW_REMINDER:    '⭐',
  MESSAGE_RECEIVED:   '💬',
  MATCH_READY:        '🎯',
  SYSTEM:             '📢',
};

export default function PanditNotifications() {
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount,   setUnreadCount]     = useState(0);
  const [loading,       setLoading]         = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    panditPortalApi.notifications({ limit: 50 })
      .then(d => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    await panditPortalApi.markNotifRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await Promise.all(notifications.filter(n => !n.isRead).map(n => panditPortalApi.markNotifRead(n._id)));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="pp-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <div className="pp-page-title">
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={{ background: 'var(--saffron)', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: '0.72rem', marginLeft: 10, fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="pp-page-sub">Stay up to date with bookings and updates</div>
        </div>
        {unreadCount > 0 && (
          <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>Loading…</div>}

      {!loading && notifications.length === 0 && (
        <div className="pp-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔔</div>
          <div style={{ color: '#aaa', fontSize: '0.9rem' }}>No notifications yet</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {notifications.map(n => (
          <div
            key={n._id}
            onClick={() => !n.isRead && markRead(n._id)}
            style={{
              display: 'flex', gap: 14, padding: '14px 16px',
              background: n.isRead ? 'white' : '#fffbee',
              borderBottom: '1px solid #f5f0e8',
              cursor: n.isRead ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <span style={{ fontSize: '1.4rem', flexShrink: 0, lineHeight: 1.2 }}>
              {TYPE_ICONS[n.type] || '📢'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.88rem', color: 'var(--text-dark)', marginBottom: 2 }}>
                {n.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.4 }}>{n.body}</div>
              <div style={{ fontSize: '0.72rem', color: '#bbb', marginTop: 4 }}>
                {new Date(n.createdTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {!n.isRead && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--saffron)', flexShrink: 0, marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
