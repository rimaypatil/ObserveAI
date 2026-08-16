import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { incidentsApi } from '@/api/incidents';
import { IncidentTable } from '@/components/incidents/IncidentTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { AlertOctagon, Filter, RefreshCw, Search, ShieldCheck } from 'lucide-react';

export const Incidents = () => {
  const { activeProject } = useProject();
  const [incidents, setIncidents] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIncidents = async () => {
    if (!activeProject) {
      setIncidents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await incidentsApi.listIncidents({
        project_id: activeProject.id,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setIncidents(data);
    } catch (err) {
      console.error('Failed to fetch incidents list:', err);
      setIncidents([]);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [activeProject, severityFilter, statusFilter]);

  const filteredIncidents = incidents.filter(inc => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return inc.title.toLowerCase().includes(term) || (inc.description && inc.description.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-brand-500" />
            Autonomous Incidents Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time anomaly detection, multi-agent AI RCA, and incident lifecycle resolution
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <ErrorState error={error} onRetry={fetchIncidents} />}

      {/* Filtering Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search incidents by keyword or title..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Severities</option>
            <option value="P0">P0 Critical</option>
            <option value="P1">P1 High</option>
            <option value="P2">P2 Medium</option>
            <option value="P3">P3 Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="AI_PROCESSING">AI Processing</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Incident Table or Empty State */}
      {filteredIncidents.length > 0 ? (
        <IncidentTable incidents={filteredIncidents} isLoading={isLoading} />
      ) : (
        <EmptyState
          title="Your systems are healthy."
          description="Once ObserveAI detects an operational anomaly or latency spike, autonomous incidents will appear here."
          icon={ShieldCheck}
        />
      )}
    </div>
  );
};
