import { apiClient } from '../api/client';
import type { Donation, DonationRequest } from '../types';

export const donorService = {
  getMyDonations: async (): Promise<{ donations: Donation[] }> => {
    const res = await apiClient.get('/donations/my');
    return res.data;
  },

  createDonation: async (payload: any): Promise<{ donation: Donation; message: string; safety_warnings?: string[] }> => {
    const res = await apiClient.post('/donations', payload);
    return res.data;
  },

  updateDonation: async (id: string | number, payload: any): Promise<{ donation: Donation; message: string }> => {
    const res = await apiClient.put(`/donations/${id}`, payload);
    return res.data;
  },

  publishDonation: async (id: string | number): Promise<{ message: string; donation: Donation }> => {
    const res = await apiClient.post(`/donations/${id}/publish`);
    return res.data;
  },

  withdrawDonation: async (id: string | number, reason?: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/donations/${id}/withdraw`, { reason });
    return res.data;
  },

  uploadImage: async (file: File): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post('/donations/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getIncomingRequests: async (): Promise<{ requests: DonationRequest[] }> => {
    // Dedicated donor requests endpoint
    const res = await apiClient.get('/requests/donor');
    return res.data;
  },

  getRequestsForDonation: async (donationId: string | number): Promise<{ requests: DonationRequest[] }> => {
    const res = await apiClient.get(`/donations/${donationId}/requests`);
    return res.data;
  },

  approveRequest: async (requestId: string | number): Promise<{ message: string; request: DonationRequest }> => {
    const res = await apiClient.post(`/requests/${requestId}/approve`);
    return res.data;
  },

  rejectRequest: async (requestId: string | number, reason?: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/requests/${requestId}/reject`, { reason });
    return res.data;
  },

  getDonorAnalytics: async (): Promise<any> => {
    const res = await apiClient.get('/analytics/donor-dashboard');
    return res.data;
  },
};
