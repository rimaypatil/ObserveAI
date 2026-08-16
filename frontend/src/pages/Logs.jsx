import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { telemetryApi } from '@/api/telemetry';
import { LogViewer } from '@/components/telemetry/LogViewer';
import { FileText, RefreshCw } from 'lucide-react';

export const Logs = () => {
  const { activeProject } = useProject();
  const [logs, setLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    if (!activeProject) return;
    setIsLoading(true);

    try {
      const data = await telemetryApi.queryLogs({
        project_id: activeProject.id,
        level: levelFilter || undefined,
        search: searchFilter || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeProject, levelFilter, searchFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-brand-500" />
            Live Application Log Stream
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time log explorer with structured attributes, trace correlation, and error level filtering
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      <LogViewer
        logs={logs}
        isLoading={isLoading}
        onSearchChange={setSearchFilter}
        onLevelChange={setLevelFilter}
      />
    </div>
  );
};
