import { apiClient } from '../api/client';
import type { User } from '../types';

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    const res = await apiClient.post('/auth/login', credentials);
    const token = res.data.access_token || res.data.token;
    const user = res.data.user;
    return { user, token };
  },

  register: async (payload: any): Promise<{ user: User; token: string }> => {
    const res = await apiClient.post('/auth/register', payload);
    const token = res.data.access_token || res.data.token;
    const user = res.data.user;
    return { user, token };
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  updateProfile: async (payload: any): Promise<{ user: User; message: string }> => {
    const res = await apiClient.put('/auth/profile', payload);
    return res.data;
  },

  logout: (): void => {
    // Clear all authorization credentials and domain-specific cached data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear any temporary draft food listings or form states
    localStorage.removeItem('shareplate_draft_donation');
    localStorage.removeItem('shareplate_cached_coords');
    sessionStorage.clear();
  },
};
