import { apiClient, unwrapData } from './client';
import { APIResponse, TokenResponse, User } from '@/types/api';

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  organization_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<User> {
    const res = await apiClient.post<APIResponse<User>>('/auth/register', payload);
    return unwrapData(res);
  },

  async login(payload: LoginPayload): Promise<TokenResponse> {
    const res = await apiClient.post<APIResponse<TokenResponse>>('/auth/login', payload);
    return unwrapData(res);
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<APIResponse<User>>('/auth/me');
    return unwrapData(res);
  },

  async forgotPassword(email: string): Promise<{ sent: boolean }> {
    const res = await apiClient.post<APIResponse<{ sent: boolean }>>('/auth/forgot-password', { email });
    return unwrapData(res);
  },

  async resetPassword(token: string, new_password: string): Promise<{ reset: boolean }> {
    const res = await apiClient.post<APIResponse<{ reset: boolean }>>('/auth/reset-password', { token, new_password });
    return unwrapData(res);
  },
};
