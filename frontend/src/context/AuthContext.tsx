import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../api/client';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isDonor: boolean;
  isReceiver: boolean;
  isAdmin: boolean;
  isVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          await refreshUser();
        } catch (e) {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password });
    const receivedToken = res.data.access_token || res.data.token;
    const receivedUser = res.data.user;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const register = async (data: any): Promise<User> => {
    const res = await authApi.register(data);
    const receivedToken = res.data.access_token || res.data.token;
    const receivedUser = res.data.user;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    authService.logout();
  };

  const isDonor = user?.role === 'DONOR';
  const isReceiver = user?.role === 'RECEIVER';
  const isAdmin = user?.role === 'ADMIN';
  const isVerified = user?.organization?.verification_status === 'VERIFIED';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        isDonor,
        isReceiver,
        isAdmin,
        isVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
