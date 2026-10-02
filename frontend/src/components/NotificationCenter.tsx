import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../stores';
import { api } from '../services/api';

export function NotificationCenter() {
  const { items, fetch, remove } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = items.filter((n: any) => !n.read).length;

  const handleMarkRead = async (id: string, currentRead: boolean) => {
    try {
      await api.notifications.markRead(id, !currentRead);
      fetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      fetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--danger)] rounded-full border border-[var(--surface)]"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
            <h3 className="font-bold text-[var(--text-primary)]">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)] text-sm">
                No notifications
              </div>
            ) : (
              items.map((notif: any) => (
                <div 
                  key={notif.id} 
                  className={`p-3 border-b border-[var(--border)] flex gap-3 hover:bg-[var(--surface-3)] transition-colors ${!notif.read ? 'bg-[var(--accent)]/5' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-[var(--text-dim)] mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 justify-start items-center">
                    <button 
                      onClick={() => handleMarkRead(notif.id, notif.read)}
                      className={`p-1 rounded hover:bg-[var(--surface-4)] ${notif.read ? 'text-[var(--text-muted)]' : 'text-[var(--accent)]'}`}
                      title={notif.read ? "Mark as unread" : "Mark as read"}
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(notif.id)}
                      className="p-1 rounded hover:bg-[var(--danger)]/20 text-[var(--text-muted)] hover:text-[var(--danger)]"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
