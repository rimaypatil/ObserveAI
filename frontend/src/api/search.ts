import { apiClient, unwrapData } from './client';
import { APIResponse, SearchResponse } from '@/types/api';

export interface SearchParams {
  query?: string;
  project_id?: string;
  severity?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export const searchApi = {
  async search(params: SearchParams): Promise<SearchResponse> {
    const res = await apiClient.get<APIResponse<SearchResponse>>('/search', { params });
    return unwrapData(res);
  },
};
