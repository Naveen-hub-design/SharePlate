import { apiClient } from '../api/client';
import type { Notification } from '../types';

export const notificationService = {
  getAll: async (): Promise<{ notifications: Notification[]; unread_count: number }> => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },

  markAllRead: async (): Promise<{ message: string }> => {
    const res = await apiClient.put('/notifications/read-all');
    return res.data;
  },

  markRead: async (id: string | number): Promise<{ message: string }> => {
    const res = await apiClient.put(`/notifications/${id}/read`);
    return res.data;
  },
};
