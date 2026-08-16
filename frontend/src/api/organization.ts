import { apiClient, unwrapData } from './client';
import { APIResponse, OrganizationDetails, OrganizationMember } from '@/types/api';

export interface InviteMemberPayload {
  email: string;
  full_name: string;
  password: string;
  role?: string;
  assigned_project_ids?: string[];
}

export interface UpdateMemberRolePayload {
  role: string;
  assigned_project_ids?: string[];
}

export const organizationApi = {
  async getOrganization(): Promise<OrganizationDetails> {
    const res = await apiClient.get<APIResponse<OrganizationDetails>>('/organization/me');
    return unwrapData(res);
  },

  async listMembers(): Promise<OrganizationMember[]> {
    const res = await apiClient.get<APIResponse<OrganizationMember[]>>('/organization/members');
    return unwrapData(res);
  },

  async inviteMember(payload: InviteMemberPayload): Promise<OrganizationMember> {
    const res = await apiClient.post<APIResponse<OrganizationMember>>('/organization/members', payload);
    return unwrapData(res);
  },

  async updateMemberRole(userId: string, payload: UpdateMemberRolePayload): Promise<OrganizationMember> {
    const res = await apiClient.put<APIResponse<OrganizationMember>>(`/organization/members/${userId}/role`, payload);
    return unwrapData(res);
  },

  async removeMember(userId: string): Promise<{ removed: boolean }> {
    const res = await apiClient.delete<APIResponse<{ removed: boolean }>>(`/organization/members/${userId}`);
    return unwrapData(res);
  },

  async transferOwnership(newOwnerId: string): Promise<{ transferred: boolean; message: string }> {
    const res = await apiClient.post<APIResponse<{ transferred: boolean; message: string }>>('/organization/transfer-ownership', {
      new_owner_id: newOwnerId,
    });
    return unwrapData(res);
  },

  async deleteOrganization(): Promise<{ deleted: boolean; message: string }> {
    const res = await apiClient.delete<APIResponse<{ deleted: boolean; message: string }>>('/organization');
    return unwrapData(res);
  },
};
