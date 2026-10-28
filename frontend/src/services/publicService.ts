import { apiClient } from '../api/client';
import type { Donation, ImpactAnalytics, Organization } from '../types';

export interface DiscoverFilterParams {
  category?: string;
  storage?: string;
  search?: string;
  donor_id?: string | number;
  lat?: number;
  lng?: number;
  max_km?: number;
  page?: number;
  per_page?: number;
}

export const publicService = {
  getDiscoverDonations: async (params?: DiscoverFilterParams): Promise<{ donations: Donation[]; total?: number }> => {
    const res = await apiClient.get('/donations/discover', { params });
    return res.data;
  },

  getDonationById: async (id: string | number): Promise<{ donation: Donation }> => {
    const res = await apiClient.get(`/donations/${id}`);
    return res.data;
  },

  getImpactMetrics: async (): Promise<{ impact: ImpactAnalytics }> => {
    const res = await apiClient.get('/analytics/impact');
    return res.data;
  },

  getOrganizationPublicProfile: async (orgId: string | number): Promise<{ organization: Partial<Organization> }> => {
    const res = await apiClient.get(`/organizations/${orgId}`);
    return res.data;
  },
};
