import { apiClient, unwrapData } from './client';
import { APIResponse, ApiKey, Project, RotateApiKeyResponse, Service } from '@/types/api';

export interface CreateProjectPayload {
  name: string;
  environment?: string;
  description?: string;
  logo_url?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  environment?: string;
  description?: string;
  logo_url?: string;
  settings?: Record<string, any>;
}

export interface CreateApiKeyPayload {
  name: string;
  environment?: string;
}

export const projectsApi = {
  async listProjects(): Promise<Project[]> {
    const res = await apiClient.get<APIResponse<Project[]>>('/projects');
    return unwrapData(res);
  },

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    const res = await apiClient.post<APIResponse<Project>>('/projects', payload);
    return unwrapData(res);
  },

  async updateProject(projectId: string, payload: UpdateProjectPayload): Promise<Project> {
    const res = await apiClient.put<APIResponse<Project>>(`/projects/${projectId}`, payload);
    return unwrapData(res);
  },

  async deleteProject(projectId: string): Promise<{ deleted: boolean }> {
    const res = await apiClient.delete<APIResponse<{ deleted: boolean }>>(`/projects/${projectId}`);
    return unwrapData(res);
  },

  async archiveProject(projectId: string): Promise<Project> {
    const res = await apiClient.post<APIResponse<Project>>(`/projects/${projectId}/archive`);
    return unwrapData(res);
  },

  async restoreProject(projectId: string): Promise<Project> {
    const res = await apiClient.post<APIResponse<Project>>(`/projects/${projectId}/restore`);
    return unwrapData(res);
  },

  async createApiKey(projectId: string, payload: CreateApiKeyPayload): Promise<ApiKey> {
    const res = await apiClient.post<APIResponse<ApiKey>>(`/projects/${projectId}/api-keys`, payload);
    return unwrapData(res);
  },

  async rotateApiKey(projectId: string, keyId: string): Promise<RotateApiKeyResponse> {
    const res = await apiClient.post<APIResponse<RotateApiKeyResponse>>(`/projects/${projectId}/api-keys/${keyId}/rotate`);
    return unwrapData(res);
  },

  async disableApiKey(projectId: string, keyId: string): Promise<{ disabled: boolean }> {
    const res = await apiClient.post<APIResponse<{ disabled: boolean }>>(`/projects/${projectId}/api-keys/${keyId}/disable`);
    return unwrapData(res);
  },

  async deleteApiKey(projectId: string, keyId: string): Promise<{ deleted: boolean }> {
    const res = await apiClient.delete<APIResponse<{ deleted: boolean }>>(`/projects/${projectId}/api-keys/${keyId}`);
    return unwrapData(res);
  },

  async listServices(projectId: string): Promise<Service[]> {
    const res = await apiClient.get<APIResponse<Service[]>>(`/projects/${projectId}/services`);
    return unwrapData(res);
  },
};
