import { apiClient } from '../api/client';
import type { DonationRequest, Donation } from '../types';

export const receiverService = {
  getMyClaims: async (): Promise<{ requests: DonationRequest[] }> => {
    // Dedicated receiver requests endpoint
    const res = await apiClient.get('/requests/receiver');
    return res.data;
  },

  claimDonation: async (
    donationId: string | number,
    payload: {
      requested_quantity: number;
      pickup_estimated_time?: string;
      requester_notes?: string;
    }
  ): Promise<{ message: string; request: DonationRequest }> => {
    const res = await apiClient.post(`/donations/${donationId}/request`, payload);
    return res.data;
  },

  cancelClaim: async (requestId: string | number, reason?: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/requests/${requestId}/cancel`, { reason });
    return res.data;
  },

  getRecommendedDonations: async (params?: { limit?: number; max_km?: number; lat?: number; lng?: number }): Promise<{ donations: Donation[] }> => {
    const res = await apiClient.get('/donations/discover', { params });
    return res.data;
  },

  getReceiverAnalytics: async (): Promise<any> => {
    const res = await apiClient.get('/analytics/receiver-dashboard');
    return res.data;
  },
};
