import { apiClient, unwrapData } from './client';
import { APIResponse, Profile } from '@/types/api';

export interface UpdateProfilePayload {
  full_name?: string;
  avatar_url?: string;
  timezone?: string;
  notification_preferences?: Record<string, any>;
}

export const profileApi = {
  async getProfile(): Promise<Profile> {
    const res = await apiClient.get<APIResponse<Profile>>('/profile');
    return unwrapData(res);
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<Profile> {
    const res = await apiClient.put<APIResponse<Profile>>('/profile', payload);
    return unwrapData(res);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ changed: boolean }> {
    const res = await apiClient.post<APIResponse<{ changed: boolean }>>('/profile/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return unwrapData(res);
  },

  async deleteAccount(): Promise<{ deleted: boolean; message: string }> {
    const res = await apiClient.delete<APIResponse<{ deleted: boolean; message: string }>>('/profile/account');
    return unwrapData(res);
  },
};
