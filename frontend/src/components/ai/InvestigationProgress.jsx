import React from 'react';
import { CheckCircle2, Loader2, Circle, Bot, Zap } from 'lucide-react';
import { clsx } from 'clsx';

export const InvestigationProgress = ({ executedAgents = [], isAnalyzing = false }) => {
  const allAgents = [
    { key: 'Planner', label: 'Planner Agent', desc: 'Loaded incident telemetry context' },
    { key: 'Log Analysis', label: 'Log Agent', desc: 'Analyzed log streams & error frequencies' },
    { key: 'Trace Analysis', label: 'Trace Agent', desc: 'Evaluated P95 latency spans & bottlenecks' },
    { key: 'Exception Analysis', label: 'Exception Agent', desc: 'Inspected unhandled stack traces' },
    { key: 'Metrics', label: 'Metrics Agent', desc: 'Evaluated CPU, memory, connection pools' },
    { key: 'Deployment', label: 'Deployment Agent', desc: 'Correlated recent release versions' },
    { key: 'RAG', label: 'RAG Agent', desc: 'Searched historical incidents & runbooks' },
    { key: 'Confidence', label: 'Confidence Agent', desc: 'Calculated evidence weight & certainty' },
    { key: 'Final RCA', label: 'RCA Agent', desc: 'Synthesized final root cause analysis' },
  ];

  const isAgentExecuted = (agentKey) => {
    if (!executedAgents || executedAgents.length === 0) return !isAnalyzing;
    const cleanKey = agentKey.toLowerCase().replace(/\s+/g, '');
    return executedAgents.some(a => {
      const cleanA = a.toLowerCase().replace(/agent$/i, '').replace(/\s+/g, '');
      return cleanA.includes(cleanKey) || cleanKey.includes(cleanA);
    });
  };

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Autonomous AI Multi-Agent Pipeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAnalyzing ? 'Running multi-agent investigation...' : 'Completed multi-agent RCA pipeline'}
            </p>
          </div>
        </div>
        {isAnalyzing ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-mono font-semibold animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analyzing Telemetry
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RCA Complete
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {allAgents.map((agent, index) => {
          const isDone = isAgentExecuted(agent.key);
          const isRunning = isAnalyzing && !isDone && (executedAgents.length === index || (index > 0 && isAgentExecuted(allAgents[index - 1].key)));

          return (
            <div
              key={agent.key}
              className={clsx(
                'p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5',
                isDone
                  ? 'border-emerald-200 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200'
                  : isRunning
                  ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 opacity-60'
              )}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : isRunning ? (
                <Loader2 className="w-4 h-4 text-brand-500 animate-spin mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-700 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-xs leading-tight">{agent.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  {agent.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
