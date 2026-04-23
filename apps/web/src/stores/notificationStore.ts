import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'budget_overdraft' | 'inventory_alert' | 'payroll_reminder' | 'system';
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (ledgerId?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (ledgerId?: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,

      fetchNotifications: async (ledgerId) => {
        set({ loading: true });
        try {
          const headers: Record<string, string> = {};
          if (ledgerId) headers['x-ledger-id'] = ledgerId;

          const response = await fetch('/api/notifications', { headers });
          const data = await response.json();

          const unreadCountResponse = await fetch(
            '/api/notifications/unread-count',
            { headers },
          );
          const { count } = await unreadCountResponse.json();

          set({ notifications: data, unreadCount: count, loading: false });
        } catch (error) {
          console.error('Failed to fetch notifications', error);
          set({ loading: false });
        }
      },

      markAsRead: async (id) => {
        try {
          await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
          const notifications = get().notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          );
          set({
            notifications,
            unreadCount: Math.max(0, get().unreadCount - 1),
          });
        } catch (error) {
          console.error('Failed to mark notification as read', error);
        }
      },

      markAllAsRead: async (ledgerId) => {
        try {
          const headers: Record<string, string> = {};
          if (ledgerId) headers['x-ledger-id'] = ledgerId;

          await fetch('/api/notifications/read-all', {
            method: 'POST',
            headers,
          });
          const notifications = get().notifications.map((n) => ({
            ...n,
            isRead: true,
          }));
          set({ notifications, unreadCount: 0 });
        } catch (error) {
          console.error('Failed to mark all as read', error);
        }
      },
    }),
    {
      name: 'notification-storage',
    },
  ),
);
