import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { dashboardApi } from '@/api/dashboard';
import { incidentsApi } from '@/api/incidents';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Modal } from '@/components/common/Modal';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  ChevronRight,
  Cpu,
  Plus,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const { projects, activeProject, createProject } = useProject();
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New project modal state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectEnv, setNewProjectEnv] = useState('production');
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    // If user has zero projects, do not fetch project-dependent stats
    if (projects.length === 0) {
      setOverview({
        project_count: 0,
        incident_count: 0,
        critical_incidents: 0,
        logs_today: 0,
        metrics_today: 0,
        traces_today: 0,
        rca_generated: 0,
        avg_resolution_time_minutes: 0,
      });
      setAnalytics({
        total_services: 0,
        healthy_services: 0,
        unhealthy_services: 0,
        active_incidents: 0,
        resolved_incidents: 0,
        total_logs_24h: 0,
        total_exceptions_24h: 0,
        ai_rca_accuracy_rate: 0,
      });
      setRecentIncidents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const overviewData = await dashboardApi.getOverview().catch(() => ({
        project_count: projects.length,
        incident_count: 0,
        critical_incidents: 0,
        logs_today: 0,
        metrics_today: 0,
        traces_today: 0,
        rca_generated: 0,
        avg_resolution_time_minutes: 0,
      }));

      const analyticsData = activeProject
        ? await dashboardApi.getAnalyticsOverview(activeProject.id).catch(() => ({
            total_services: 0,
            healthy_services: 0,
            unhealthy_services: 0,
            active_incidents: 0,
            resolved_incidents: 0,
            total_logs_24h: 0,
            total_exceptions_24h: 0,
            ai_rca_accuracy_rate: 0,
          }))
        : null;

      setOverview(overviewData);
      setAnalytics(analyticsData);

      if (activeProject) {
        const incidents = await incidentsApi.listIncidents({
          project_id: activeProject.id,
          limit: 5,
        }).catch(() => []);
        setRecentIncidents(incidents);
      } else {
        setRecentIncidents([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProject, projects.length]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsSubmittingProject(true);
    try {
      await createProject({
        name: newProjectName.trim(),
        environment: newProjectEnv,
      });
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
    } catch (err) {
      console.error('Failed to create project from dashboard:', err);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading ObserveAI system health & active incidents..." type="skeleton" count={4} />;
  }

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Engineer';
  const hasZeroProjects = projects.length === 0;

  // Calculated metrics
  const healthyCount = hasZeroProjects
    ? 0
    : analytics?.healthy_services ?? overview?.project_count ?? 0;
  const degradedCount = hasZeroProjects ? 0 : analytics?.unhealthy_services ?? 0;
  const criticalCount = hasZeroProjects ? 0 : overview?.critical_incidents ?? 0;
  const activeIncidentCount = hasZeroProjects ? 0 : analytics?.active_incidents ?? overview?.incident_count ?? 0;
  const totalServices = hasZeroProjects ? 0 : analytics?.total_services ?? 0;
  const healthyServices = hasZeroProjects ? 0 : analytics?.healthy_services ?? 0;
  const errorRateStr = hasZeroProjects || !analytics?.total_logs_24h || analytics.total_logs_24h === 0
    ? '0%'
    : `${((analytics.total_exceptions_24h / analytics.total_logs_24h) * 100).toFixed(1)}%`;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Greeting Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Good morning, {firstName}.
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System health summary for <span className="font-semibold text-brand-500">{activeProject?.name || (hasZeroProjects ? 'No Project Selected' : 'All Projects')}</span>
          </p>
        </div>

        {hasZeroProjects ? (
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Project
          </button>
        ) : (
          <button
            onClick={() => navigate('/incidents')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-colors"
          >
            View Active Incidents
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <ErrorState error={error} onRetry={fetchDashboardData} />}

      {/* Above the Fold System Health Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Health */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>System Health</span>
            <Activity className={`w-4 h-4 ${hasZeroProjects ? 'text-slate-400' : 'text-emerald-500'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {healthyCount} Healthy
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium pt-1">
            <span className="text-amber-500">{degradedCount} Degraded</span>
            <span className="text-rose-500">{criticalCount} Critical</span>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Incidents</span>
            <AlertOctagon className={`w-4 h-4 ${hasZeroProjects || activeIncidentCount === 0 ? 'text-slate-400' : 'text-amber-500'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {activeIncidentCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {activeIncidentCount === 0 ? 'No active incidents' : `${criticalCount} critical needing immediate attention`}
          </p>
        </div>

        {/* Active Services */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Discovered Services</span>
            <Server className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalServices}
          </div>
          <p className={`text-[11px] font-medium ${hasZeroProjects || healthyServices === 0 ? 'text-slate-400' : 'text-emerald-500'}`}>
            {healthyServices} services operational
          </p>
        </div>

        {/* Error Rate */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Telemetry Error Rate</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {errorRateStr}
          </div>
          <p className="text-[11px] text-slate-400">
            {hasZeroProjects || !analytics?.total_logs_24h ? 'No telemetry available' : `Average resolution time ~${overview?.avg_resolution_time_minutes || 0}m`}
          </p>
        </div>
      </div>

      {/* AI Key RCA Insight Highlight */}
      <div className="p-6 rounded-2xl border border-brand-200 dark:border-brand-900/50 bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3 max-w-2xl">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md shadow-brand-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              AI Autonomous Insight
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {hasZeroProjects
                ? '"Your AI investigation workspace is ready. Create your first project and connect your application to start receiving autonomous incident analysis."'
                : recentIncidents.length > 0 && recentIncidents[0].root_cause_summary
                ? `"${recentIncidents[0].root_cause_summary}"`
                : `"No active incidents detected for ${activeProject?.name || 'this project'}. Autonomous AI monitoring telemetry signals."`}
            </p>
          </div>
        </div>

        {hasZeroProjects ? (
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold shadow-md hover:bg-brand-600 transition-colors flex items-center gap-1.5"
          >
            Create Project
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : recentIncidents.length > 0 ? (
          <button
            onClick={() => navigate(`/incidents/${recentIncidents[0].id}`)}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold shadow-md hover:bg-brand-600 transition-colors flex items-center gap-1.5"
          >
            Investigate Incident
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/settings')}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            View SDK Setup
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recent Incidents List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Recent Incidents Needing Action
          </h2>
          {!hasZeroProjects && recentIncidents.length > 0 && (
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs font-semibold text-brand-500 hover:underline"
            >
              View All Incidents →
            </button>
          )}
        </div>

        {recentIncidents.length > 0 ? (
          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.id}`)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 transition-all cursor-pointer shadow-sm flex flex-wrap items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={incident.severity} size="md" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors">
                      {incident.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {incident.root_cause_summary || 'Autonomous RCA completed'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-slate-400">
                    {new Date(incident.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-brand-500 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Inspect RCA
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {hasZeroProjects ? 'No projects or incidents yet' : 'No incidents detected yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {hasZeroProjects
                  ? 'Create a project and connect the ObserveAI SDK to start monitoring telemetry and automated RCA.'
                  : 'Active ObserveAI SDK telemetry will automatically trigger multi-agent RCA upon operational anomalies.'}
              </p>
            </div>
            <button
              onClick={() => {
                if (hasZeroProjects) {
                  setIsNewProjectModalOpen(true);
                } else {
                  navigate('/settings');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs hover:bg-brand-600 transition-colors shadow-sm"
            >
              {hasZeroProjects ? 'Create Project' : 'Connect Application'}
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Project Creation Modal */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Payment Infrastructure"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Environment
            </label>
            <select
              value={newProjectEnv}
              onChange={e => setNewProjectEnv(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingProject}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmittingProject ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
