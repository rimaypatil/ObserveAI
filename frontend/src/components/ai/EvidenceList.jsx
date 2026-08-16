import React from 'react';
import { Activity, AlertTriangle, Code, Cpu, FileText, GitCommit, Layers } from 'lucide-react';

export const EvidenceList = ({ evidence = {} }) => {
  const logEvidence = evidence.log_evidence || evidence.logs || [];
  const traceEvidence = evidence.trace_evidence || evidence.traces || [];
  const metricEvidence = evidence.metric_evidence || evidence.metrics || [];
  const deploymentEvidence = evidence.deployment_evidence || evidence.deployments || [];
  const exceptionEvidence = evidence.exception_evidence || evidence.exceptions || [];

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Layers className="w-4 h-4 text-brand-500" />
        Supporting Telemetry Evidence
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Log Evidence */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
            <FileText className="w-4 h-4" />
            <span>Log Signal Evidence</span>
          </div>
          {logEvidence.length > 0 ? (
            <div className="space-y-1.5 font-mono text-xs">
              {logEvidence.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900 text-rose-300 overflow-x-auto text-[11px]">
                  {typeof item === 'string' ? item : item.message || JSON.stringify(item)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No log signal evidence recorded for this incident.</p>
          )}
        </div>

        {/* Trace Evidence */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold text-xs">
            <Activity className="w-4 h-4" />
            <span>Trace & Latency Bottlenecks</span>
          </div>
          {traceEvidence.length > 0 ? (
            <div className="space-y-1.5 text-xs">
              {traceEvidence.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-800 font-mono text-[11px]">
                  {typeof item === 'string' ? item : `${item.operation_name || item.name || 'Span'}${item.duration_ms ? ` — P95: ${item.duration_ms}ms` : item.status_code ? ` — Status: ${item.status_code}` : ''}`}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No trace latency evidence recorded for this incident.</p>
          )}
        </div>

        {/* Metric Evidence */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
            <Cpu className="w-4 h-4" />
            <span>Infrastructure Signals</span>
          </div>
          {metricEvidence.length > 0 ? (
            <div className="space-y-1.5 text-xs">
              {metricEvidence.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-800 font-mono text-[11px]">
                  {typeof item === 'string' ? item : `${item.name}: ${item.value} ${item.unit || ''}`}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No infrastructure metric signals recorded for this incident.</p>
          )}
        </div>

        {/* Deployment Evidence */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs">
            <GitCommit className="w-4 h-4" />
            <span>Release Correlation</span>
          </div>
          {deploymentEvidence.length > 0 ? (
            <div className="space-y-1.5 text-xs">
              {deploymentEvidence.slice(0, 2).map((item, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-800 font-mono text-[11px]">
                  {typeof item === 'string' ? item : `Version: ${item.version || 'N/A'}${item.status ? ` (${item.status})` : ''}${item.author ? ` by ${item.author}` : ''}`}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No release deployments correlated with this incident.</p>
          )}
        </div>
      </div>
    </div>
  );
};
