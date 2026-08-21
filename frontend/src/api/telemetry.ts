import { apiClient, unwrapData } from './client';
import { APIResponse, ExceptionItem, LogItem, TraceItem } from '@/types/api';

export interface QueryLogsParams {
  project_id: string;
  service_id?: string;
  level?: string;
  trace_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const telemetryApi = {
  async queryLogs(params: QueryLogsParams): Promise<LogItem[]> {
    const res = await apiClient.get<APIResponse<LogItem[]>>('/telemetry/logs', { params });
    return unwrapData(res);
  },

  async getTraceWaterfall(traceId: string, projectId: string): Promise<TraceItem[]> {
    const res = await apiClient.get<APIResponse<TraceItem[]>>(`/telemetry/traces/${traceId}`, {
      params: { project_id: projectId },
    });
    return unwrapData(res);
  },

  async queryExceptions(projectId: string, serviceId?: string, limit: number = 50): Promise<ExceptionItem[]> {
    const res = await apiClient.get<APIResponse<ExceptionItem[]>>('/telemetry/exceptions', {
      params: { project_id: projectId, service_id: serviceId, limit },
    });
    return unwrapData(res);
  },

  async getTelemetrySummary(projectId: string): Promise<{
    logs_count: number;
    metrics_count: number;
    traces_count: number;
    error_rate_percentage: number;
  }> {
    const res = await apiClient.get<APIResponse<any>>('/telemetry/summary', {
      params: { project_id: projectId },
    });
    return unwrapData(res);
  },

  async getTopErrors(projectId: string): Promise<Array<{ error_message: string; count: number; service: string }>> {
    const res = await apiClient.get<APIResponse<any>>('/telemetry/top-errors', {
      params: { project_id: projectId },
    });
    return unwrapData(res);
  },

  async getTopServices(projectId: string): Promise<Array<{ service_name: string; log_volume: number; status: string }>> {
    const res = await apiClient.get<APIResponse<any>>('/telemetry/top-services', {
      params: { project_id: projectId },
    });
    return unwrapData(res);
  },

  async getLatencyStats(projectId: string): Promise<{ p50_ms: number; p95_ms: number; p99_ms: number }> {
    const res = await apiClient.get<APIResponse<any>>('/telemetry/latency', {
      params: { project_id: projectId },
    });
    return unwrapData(res);
  },

  async getLatencyTimeseries(
    projectId: string,
    hours: number = 1
  ): Promise<Array<{ timestamp: string; p50_ms: number; p95_ms: number; p99_ms: number }>> {
    const res = await apiClient.get<APIResponse<any>>('/telemetry/timeseries/latency', {
      params: { project_id: projectId, hours },
    });
    return unwrapData(res);
  },

  async getThroughputTimeseries(
    projectId: string,
    hours: number = 1
  ): Promise<Array<{ timestamp: string; request_count: number; error_count: number }>> {
    const res = await apiClient.get<APIResponse<any>>('/telemetry/timeseries/throughput', {
      params: { project_id: projectId, hours },
    });
    return unwrapData(res);
  },
};
