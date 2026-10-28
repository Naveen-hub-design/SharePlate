import { apiClient } from '../api/client';
import type { RouteDirectionResponse } from '../types';

export const routeService = {
  getDirections: async (params: {
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
    mode?: string;
    donation_id?: string | number;
  }): Promise<{ direction: RouteDirectionResponse }> => {
    const res = await apiClient.get('/routes/directions', { params });
    return res.data;
  },

  geocode: async (query: string): Promise<any> => {
    const res = await apiClient.get('/routes/geocode', { params: { query } });
    return res.data;
  },

  getLiveOperationsRadar: async (): Promise<any> => {
    const res = await apiClient.get('/routes/live-radar');
    return res.data;
  },
};

