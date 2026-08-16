import { apiClient, unwrapData } from './client';
import { APIResponse, DashboardOverview, OverviewStats } from '@/types/api';

export const dashboardApi = {
  async getOverview(): Promise<DashboardOverview> {
    const res = await apiClient.get<APIResponse<DashboardOverview>>('/dashboard/overview');
    return unwrapData(res);
  },

  async getAnalyticsOverview(projectId: string): Promise<OverviewStats> {
    const res = await apiClient.get<APIResponse<OverviewStats>>('/analytics/overview', {
      params: { project_id: projectId },
    });
    return unwrapData(res);
  },
};
