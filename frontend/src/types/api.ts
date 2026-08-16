export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, any>;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ErrorDetail {
  error_code: string;
  message: string;
  details?: Record<string, any>;
}

export interface StandardErrorResponse {
  success: false;
  error: ErrorDetail;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'OWNER' | 'MEMBER' | string;
  organization_id?: string;
  organization_name?: string;
  timezone?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  environment: string;
  description?: string;
  logo_url?: string;
  is_archived: boolean;
  archived_at?: string;
  settings?: Record<string, any>;
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  environment: string;
  raw_key?: string;
  created_at: string;
  is_active: boolean;
}

export interface RotateApiKeyResponse {
  id: string;
  name: string;
  prefix: string;
  environment: string;
  new_raw_key: string;
  rotated_at: string;
}

export interface Service {
  id: string;
  project_id: string;
  name: string;
  type: string;
  language?: string;
  framework?: string;
  is_healthy: boolean;
  last_seen_at?: string;
}

export interface RcaReport {
  id: string;
  summary: string;
  root_cause: string;
  timeline_json: Array<{ time?: string; timestamp?: string; event: string; status?: string }>;
  evidence_json: {
    log_evidence?: any[];
    trace_evidence?: any[];
    metric_evidence?: any[];
    deployment_evidence?: any[];
    exception_evidence?: any[];
    [key: string]: any;
  };
  historical_matches_json: Array<{ incident_title?: string; similarity_score?: number; resolution?: string }>;
  fix_recommendations_json: string[];
  prevention_actions_json: string[];
  confidence_score: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  reasoning_tree_json?: {
    executed_agents?: string[];
    planner_decisions?: any;
    agent_reasoning?: Record<string, any>;
    confidence_reasoning?: any;
    historical_matches?: any[];
    [key: string]: any;
  };
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  message: string;
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

export type SeverityType = 'P0' | 'P1' | 'P2' | 'P3';
export type IncidentStatusType = 'CREATED' | 'AI_PROCESSING' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'ARCHIVED';

export interface Incident {
  id: string;
  project_id: string;
  service_id: string;
  title: string;
  description?: string;
  severity: SeverityType;
  priority: string;
  status: IncidentStatusType;
  assigned_to_id?: string;
  owner_id?: string;
  root_cause_summary?: string;
  confidence_score?: number;
  started_at: string;
  resolved_at?: string;
  environment?: string;
  service_name?: string;
  timeline_events?: TimelineEvent[];
  rca_report?: RcaReport;
  comments?: IncidentComment[];
}

export interface LogItem {
  timestamp?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | string;
  message: string;
  logger_name?: string;
  trace_id?: string;
  span_id?: string;
  service_name?: string;
  attributes?: Record<string, any>;
}

export interface TraceItem {
  timestamp?: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  operation_name: string;
  duration_ms: number;
  status_code: number;
  attributes?: Record<string, any>;
}

export interface ExceptionItem {
  timestamp?: string;
  exception_type: string;
  message: string;
  stacktrace: string;
  file_name?: string;
  line_number?: number;
  function_name?: string;
  handled: boolean;
  trace_id?: string;
}

export interface DashboardOverview {
  project_count: number;
  incident_count: number;
  critical_incidents: number;
  logs_today: number;
  metrics_today: number;
  traces_today: number;
  rca_generated: number;
  avg_resolution_time_minutes: number;
}

export interface OverviewStats {
  total_services: number;
  healthy_services: number;
  unhealthy_services: number;
  active_incidents: number;
  resolved_incidents: number;
  total_logs_24h: number;
  total_exceptions_24h: number;
  ai_rca_accuracy_rate: number;
}

export interface KnowledgeDocument {
  id: string;
  project_id: string;
  title: string;
  doc_type: string;
  category?: string;
  tags?: string[];
  file_hash: string;
  version: number;
  vector_collection: string;
  is_indexed: boolean;
  chunk_count: number;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'OWNER' | 'MEMBER' | string;
  organization_id?: string;
  organization_name?: string;
  avatar_url?: string;
  timezone: string;
  notification_preferences?: Record<string, any>;
  created_at: string;
}

export interface SearchResultItem {
  id: string;
  entity_type: string;
  title: string;
  description?: string;
  project_id?: string;
  created_at: any;
}

export interface SearchResponse {
  items: SearchResultItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface RCAFeedback {
  id: string;
  incident_id: string;
  rca_report_id?: string;
  user_id: string;
  is_helpful: boolean;
  rating?: number;
  comment?: string;
  created_at: string;
}

export interface OrganizationMember {
  user_id: string;
  email: string;
  full_name: string;
  role: 'OWNER' | 'MEMBER' | string;
  created_at: string;
  assigned_project_ids: string[];
}

export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  total_members: number;
  total_projects: number;
}
