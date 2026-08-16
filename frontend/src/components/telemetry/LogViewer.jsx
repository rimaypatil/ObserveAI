import React, { useState } from 'react';
import { Filter, Search, Terminal, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';

export const LogViewer = ({ logs = [], isLoading = false, onSearchChange, onLevelChange }) => {
  const [expandedLogIdx, setExpandedLogIdx] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);

  const levelStyles = {
    INFO: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    WARN: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    ERROR: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    CRITICAL: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
      {/* Search & Level Filters Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter logs by message or trace ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => {
              setSelectedLevel(e.target.value);
              if (onLevelChange) onLevelChange(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        <span className="text-xs font-mono font-medium text-slate-400">
          Showing {logs.length} logs
        </span>
      </div>

      {/* Log Console Container */}
      <div className="font-mono text-xs overflow-x-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[600px] overflow-y-auto bg-slate-950 text-slate-200">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Terminal className="w-6 h-6 animate-pulse mx-auto text-brand-500" />
            <p>Streaming application log data...</p>
          </div>
        ) : logs.length > 0 ? (
          logs.map((log, idx) => {
            const isExpanded = expandedLogIdx === idx;
            const level = (log.level || 'INFO').toUpperCase();

            return (
              <div key={idx} className="group">
                <div
                  onClick={() => setExpandedLogIdx(isExpanded ? null : idx)}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-900 cursor-pointer transition-colors"
                >
                  <span className="text-slate-500 text-[11px] whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '10:44:12'}
                  </span>

                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap',
                      levelStyles[level] || levelStyles.INFO
                    )}
                  >
                    {level}
                  </span>

                  <span className="text-slate-400 text-[11px] whitespace-nowrap">
                    [{log.service_name || 'payment-service'}]
                  </span>

                  <p className="text-slate-200 truncate flex-1 leading-snug">
                    {log.message}
                  </p>

                  {log.trace_id && (
                    <span className="text-[10px] text-brand-400 bg-brand-950 px-1.5 py-0.5 rounded border border-brand-800">
                      trace:{log.trace_id.slice(0, 8)}
                    </span>
                  )}

                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                {/* Expanded Log Details */}
                {isExpanded && (
                  <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 text-[11px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">Structured Attributes</span>
                      <button
                        onClick={() => handleCopy(JSON.stringify(log, null, 2), idx)}
                        className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedIdx === idx ? 'Copied' : 'Copy JSON'}
                      </button>
                    </div>
                    <pre className="p-3 rounded bg-slate-950 text-slate-300 overflow-x-auto text-[11px] border border-slate-800">
                      {JSON.stringify(log, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-500">
            No logs matched the current search filters.
          </div>
        )}
      </div>
    </div>
  );
};
