import { apiClient, unwrapData } from './client';
import { APIResponse, KnowledgeDocument } from '@/types/api';

export interface UploadDocumentPayload {
  title: string;
  doc_type: string; // runbook | architecture | postmortem | playbooks | docs
  content: string;
  category?: string;
  tags?: string[];
}

export interface RAGSearchPayload {
  query: string;
  service_name?: string;
  severity?: string;
  top_k?: number;
}

export const knowledgeApi = {
  async uploadDocument(projectId: string, payload: UploadDocumentPayload): Promise<KnowledgeDocument> {
    const res = await apiClient.post<APIResponse<KnowledgeDocument>>('/knowledge/upload', payload, {
      params: { project_id: projectId },
    });
    return unwrapData(res);
  },

  async listDocuments(projectId: string, docType?: string): Promise<KnowledgeDocument[]> {
    const res = await apiClient.get<APIResponse<KnowledgeDocument[]>>('/knowledge/documents', {
      params: { project_id: projectId, doc_type: docType },
    });
    return unwrapData(res);
  },

  async searchRAG(projectId: string, payload: RAGSearchPayload): Promise<any> {
    const res = await apiClient.post<APIResponse<any>>('/knowledge/search', payload, {
      params: { project_id: projectId },
    });
    return unwrapData(res);
  },
};
