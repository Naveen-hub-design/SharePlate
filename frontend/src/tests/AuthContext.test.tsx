import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';

// Mock authApi
vi.mock('../api/client', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
  },
  apiClient: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('AuthContext', () => {
  it('provides authentication helpers and initializes with null user', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isDonor).toBe(false);
    expect(result.current.isReceiver).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isVerified).toBe(false);
  });

  it('correctly sets role helpers after successful donor login', async () => {
    const fakeDonor = {
      id: 'donor-123',
      email: 'donor@tajhotels.demo',
      full_name: 'Taj Banquet Kitchen',
      role: 'DONOR',
      is_active: true,
      created_at: new Date().toISOString(),
      organization: {
        id: 'org-1',
        name: 'Taj Hotels Bangalore',
        verification_status: 'VERIFIED',
      },
    };

    (authApi.login as any).mockResolvedValueOnce({
      data: {
        access_token: 'fake-jwt-token-123',
        user: fakeDonor,
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const loggedUser = await result.current.login('donor@tajhotels.demo', 'password123');
      expect(loggedUser.id).toBe('donor-123');
    });

    expect(result.current.isDonor).toBe(true);
    expect(result.current.isReceiver).toBe(false);
    expect(result.current.isVerified).toBe(true);
    expect(result.current.token).toBe('fake-jwt-token-123');
  });

  it('clears state on logout', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
