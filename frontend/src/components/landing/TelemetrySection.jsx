import React from 'react';
import { FileText, Bug, Activity, LineChart, GitCommit } from 'lucide-react';

export const TelemetrySection = () => {
  const telemetryCards = [
    {
      title: 'Logs',
      tagline: 'Understand what your application was doing when something failed.',
      desc: 'Ingests structured and unstructured application logs, error patterns, module contexts, and level distributions.',
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      signals: ['Structured JSON Logs', 'Log Levels (INFO, WARN, ERROR)', 'Context Attributes', 'Error Pattern Clustering']
    },
    {
      title: 'Exceptions',
      tagline: 'Trace failures back to their exception types and stack traces.',
      desc: 'Captures uncaught runtime exceptions, stack frames, failing class names, functions, and source line numbers.',
      icon: Bug,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      signals: ['Unhandled Exceptions', 'Stack Trace Frames', 'Exception Hierarchy', 'Root Cause Class']
    },
    {
      title: 'Traces',
      tagline: 'Find slow endpoints, spans, and distributed bottlenecks.',
      desc: 'Analyzes end-to-end HTTP request latencies, span durations, database query bottlenecks, and 5xx failure rates.',
      icon: Activity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      signals: ['P95 & P99 Latency', 'HTTP Endpoint Spans', 'Database Queries', 'Downstream Service Calls']
    },
    {
      title: 'Metrics',
      tagline: 'Detect resource and performance anomalies.',
      desc: 'Tracks CPU utilization, RAM memory pressure, garbage collection, heap sizing, and request throughput.',
      icon: LineChart,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      signals: ['CPU & Memory %', 'JVM / Node Heap', 'RPS Throughput', 'System Resource Thresholds']
    },
    {
      title: 'Deployments',
      tagline: 'Correlate failures with releases and commits.',
      desc: 'Tracks application release events, Git commit hashes, author metadata, and deployment timing correlations.',
      icon: GitCommit,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      signals: ['Git Commit SHA', 'Release Timestamps', 'Commit Author', 'Environment Tags']
    }
  ];

  return (
    <section className="py-24 bg-[#0B1120] relative border-t border-[#263247]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>Unified Telemetry Signals</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Comprehensive Telemetry Intelligence
          </h2>
          <p className="text-base text-slate-400">
            ObserveAI ingests five core operational telemetry dimensions to construct a complete timeline of your system state.
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {telemetryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-3xl bg-[#172033] border border-[#263247] hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between shadow-xl group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl ${card.bg} border ${card.border} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-[#0B1120] px-2.5 py-1 rounded-full border border-[#263247]">
                      SIGNAL #{idx + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-100 mb-1 group-hover:text-blue-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs font-semibold text-blue-400 mb-3">
                      &quot;{card.tagline}&quot;
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#263247] space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Captured Attributes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {card.signals.map((sig, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1120] text-slate-300 border border-[#263247]"
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
