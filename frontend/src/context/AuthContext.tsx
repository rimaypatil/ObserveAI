import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types/api';
import { authApi, LoginPayload, RegisterPayload } from '@/api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('observeai_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (err) {
      console.error('Failed to validate stored access token:', err);
      localStorage.removeItem('observeai_access_token');
      localStorage.removeItem('observeai_refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials: LoginPayload) => {
    setIsLoading(true);
    try {
      const tokenResp = await authApi.login(credentials);
      localStorage.setItem('observeai_access_token', tokenResp.access_token);
      localStorage.setItem('observeai_refresh_token', tokenResp.refresh_token);
      const userData = await authApi.getMe();
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    setIsLoading(true);
    try {
      await authApi.register(data);
      // Auto login after registration
      await login({ email: data.email, password: data.password });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('observeai_access_token');
    localStorage.removeItem('observeai_refresh_token');
    localStorage.removeItem('observeai_active_project_id');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
