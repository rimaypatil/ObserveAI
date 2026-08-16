import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SeverityBadge } from '../common/SeverityBadge';
import { Badge } from '../common/Badge';
import { Bot, ChevronRight, Clock, Server } from 'lucide-react';

export const IncidentTable = ({ incidents = [], isLoading = false }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'INVESTIGATING':
        return <Badge variant="warning">INVESTIGATING</Badge>;
      case 'AI_PROCESSING':
        return <Badge variant="primary">AI PROCESSING</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">RESOLVED</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral">CLOSED</Badge>;
      default:
        return <Badge variant="error">{status || 'OPEN'}</Badge>;
    }
  };

  const formatDuration = (startedAt, resolvedAt) => {
    const start = new Date(startedAt).getTime();
    const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
    const diffMin = Math.max(1, Math.round((end - start) / 60000));
    if (diffMin < 60) return `${diffMin}m`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        ))}
      </div>
    );
  }

  if (!incidents.length) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="py-3.5 px-4">Severity</th>
            <th className="py-3.5 px-4">Incident Title</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">AI RCA</th>
            <th className="py-3.5 px-4">Duration</th>
            <th className="py-3.5 px-4">Started At</th>
            <th className="py-3.5 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
          {incidents.map((incident) => {
            const hasRca = !!incident.root_cause_summary || !!incident.rca_report;
            const confidence = incident.confidence_score != null ? Math.round(incident.confidence_score * 100) : null;

            return (
              <tr
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.id}`)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
              >
                {/* Severity */}
                <td className="py-4 px-4 whitespace-nowrap">
                  <SeverityBadge severity={incident.severity} size="sm" />
                </td>

                {/* Title */}
                <td className="py-4 px-4">
                  <div className="max-w-md">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors truncate">
                      {incident.title}
                    </p>
                    {incident.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {incident.description}
                      </p>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-4 whitespace-nowrap">
                  {getStatusBadge(incident.status)}
                </td>

                {/* AI RCA Availability */}
                <td className="py-4 px-4 whitespace-nowrap">
                  {hasRca ? (
                    <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-semibold text-xs">
                      <Bot className="w-4 h-4 text-brand-500" />
                      <span>RCA Available</span>
                      {confidence && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                          {confidence}%
                        </span>
                      )}
                    </div>
                  ) : incident.status === 'AI_PROCESSING' ? (
                    <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-xs animate-pulse">
                      <Bot className="w-4 h-4" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">Pending</span>
                  )}
                </td>

                {/* Duration */}
                <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDuration(incident.started_at, incident.resolved_at)}
                  </div>
                </td>

                {/* Started At */}
                <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">
                  {new Date(incident.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>

                {/* Action */}
                <td className="py-4 px-4 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 group-hover:translate-x-0.5 transition-transform">
                    Investigate
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
