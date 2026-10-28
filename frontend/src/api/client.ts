import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle expired sessions
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear and notify
      const originalRequest = error.config;
      if (!originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: (data: { email: string; password: string }) => apiClient.post('/auth/login', data),
  register: (data: any) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data: any) => apiClient.put('/auth/profile', data),
};

// Organization Endpoints
export const orgApi = {
  register: (data: any) => apiClient.post('/organizations', data),
  getMyOrg: () => apiClient.get('/organizations/my'),
  getPending: () => apiClient.get('/organizations/pending'),
  verifyOrg: (id: string, notes?: string) => apiClient.post(`/organizations/${id}/verify`, { notes }),
  rejectOrg: (id: string, reason: string) => apiClient.post(`/organizations/${id}/reject`, { reason }),
};

// Donation Endpoints
export const donationApi = {
  getDiscover: (params?: any) => apiClient.get('/donations/discover', { params }),
  getById: (id: string) => apiClient.get(`/donations/${id}`),
  create: (data: any) => apiClient.post('/donations', data),
  update: (id: string, data: any) => apiClient.put(`/donations/${id}`, data),
  publish: (id: string) => apiClient.post(`/donations/${id}/publish`),
  withdraw: (id: string, reason?: string) => apiClient.post(`/donations/${id}/withdraw`, { reason }),
  getMyDonations: () => apiClient.get('/donations/my'),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post('/donations/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Requests and Reservations
export const requestApi = {
  create: (donationId: string, data: { requested_quantity: number; pickup_estimated_time?: string; requester_notes?: string }) =>
    apiClient.post(`/donations/${donationId}/request`, data),
  approve: (requestId: string) => apiClient.post(`/requests/${requestId}/approve`),
  reject: (requestId: string, reason?: string) => apiClient.post(`/requests/${requestId}/reject`, { reason }),
  cancel: (requestId: string, reason?: string) => apiClient.post(`/requests/${requestId}/cancel`, { reason }),
  getMyRequests: () => apiClient.get('/requests/my'),
  getForDonation: (donationId: string) => apiClient.get(`/donations/${donationId}/requests`),
};

// Pickups and Handover
export const pickupApi = {
  verifyHandover: (data: {
    request_id: string;
    pickup_code: string;
    collector_name: string;
    collector_phone: string;
    pickup_temperature_celsius?: number;
    safety_checklist_confirmed: boolean;
    notes?: string;
  }) => apiClient.post('/pickups/verify', data),
  getPickupHistory: () => apiClient.get('/pickups/history'),
};

// Notifications
export const notificationApi = {
  getAll: () => apiClient.get('/notifications'),
  markRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/notifications/read-all'),
};

// Safety Reports
export const safetyApi = {
  submitReport: (donationId: string, data: { reason: string; details: string }) =>
    apiClient.post(`/safety/reports/${donationId}`, data),
  getAllReports: (status?: string) => apiClient.get('/safety/reports', { params: { status } }),
  updateReport: (reportId: string, data: { status: string; action_taken?: string; admin_notes?: string }) =>
    apiClient.put(`/safety/reports/${reportId}`, data),
};

// Admin Management
export const adminApi = {
  getOverview: () => apiClient.get('/admin/overview'),
  getUsers: (params?: any) => apiClient.get('/admin/users', { params }),
  toggleUserStatus: (userId: string, is_active: boolean) =>
    apiClient.put(`/admin/users/${userId}/status`, { is_active }),
  getAuditLogs: (params?: any) => apiClient.get('/admin/audit-logs', { params }),
};

// Impact Analytics
export const analyticsApi = {
  getImpact: () => apiClient.get('/analytics/impact'),
};

// AI Assistants
export const aiApi = {
  analyzePhoto: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post('/ai/analyze-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  suggestListing: (data: { title: string; category?: string; partial_description?: string; notes?: string }) =>
    apiClient.post('/ai/suggest-listing', data),
  matchDonation: (donationId: string, receiverOrgId?: string) =>
    apiClient.post(`/ai/match-donation/${donationId}`, { receiver_org_id: receiverOrgId }),
};

// Route & Navigation Endpoints
export const routeApi = {
  getDirections: (params: {
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
    mode?: string;
    donation_id?: string | number;
  }) => apiClient.get('/routes/directions', { params }),
  geocode: (query: string) => apiClient.get('/routes/geocode', { params: { query } }),
};
