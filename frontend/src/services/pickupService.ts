import { apiClient } from '../api/client';
import type { PickupRecord } from '../types';

export const pickupService = {
  verifyHandover: async (payload: {
    request_id: string;
    pickup_code: string;
    collector_name: string;
    collector_phone: string;
    pickup_temperature_celsius?: number;
    safety_checklist_confirmed: boolean;
    notes?: string;
  }): Promise<{ message: string; pickup_record: PickupRecord }> => {
    const res = await apiClient.post('/pickups/verify', payload);
    return res.data;
  },

  getPickupHistory: async (): Promise<{ pickups: PickupRecord[] }> => {
    const res = await apiClient.get('/pickups/history');
    return res.data;
  },
};
