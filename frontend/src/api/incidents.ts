import { apiClient, unwrapData } from './client';
import { APIResponse, Incident, IncidentComment, RCAFeedback } from '@/types/api';

export interface ListIncidentsParams {
  project_id: string;
  status?: string;
  severity?: string;
  service_id?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateIncidentStatusPayload {
  status: string;
  root_cause_summary?: string;
}

export interface SubmitFeedbackPayload {
  is_helpful: boolean;
  rating?: number;
  comment?: string;
}

export const incidentsApi = {
  async listIncidents(params: ListIncidentsParams): Promise<Incident[]> {
    const res = await apiClient.get<APIResponse<Incident[]>>('/incidents', { params });
    return unwrapData(res);
  },

  async getIncidentDetails(incidentId: string): Promise<Incident> {
    const res = await apiClient.get<APIResponse<Incident>>(`/incidents/${incidentId}`);
    return unwrapData(res);
  },

  async updateStatus(incidentId: string, payload: UpdateIncidentStatusPayload): Promise<Incident> {
    const res = await apiClient.patch<APIResponse<Incident>>(`/incidents/${incidentId}/status`, payload);
    return unwrapData(res);
  },

  async assignIncident(incidentId: string, assignedToId: string): Promise<Incident> {
    const res = await apiClient.post<APIResponse<Incident>>(`/incidents/${incidentId}/assign`, { assigned_to_id: assignedToId });
    return unwrapData(res);
  },

  async addComment(incidentId: string, comment: string): Promise<IncidentComment> {
    const res = await apiClient.post<APIResponse<IncidentComment>>(`/incidents/${incidentId}/comments`, { comment });
    return unwrapData(res);
  },

  async submitFeedback(incidentId: string, payload: SubmitFeedbackPayload): Promise<RCAFeedback> {
    const res = await apiClient.post<APIResponse<RCAFeedback>>(`/incidents/${incidentId}/feedback`, payload);
    return unwrapData(res);
  },

  async getFeedback(incidentId: string): Promise<RCAFeedback[]> {
    const res = await apiClient.get<APIResponse<RCAFeedback[]>>(`/incidents/${incidentId}/feedback`);
    return unwrapData(res);
  },
};
