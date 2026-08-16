import React, { useState } from 'react';
import {
  Compass,
  FileText,
  Activity,
  Bug,
  LineChart,
  GitCommit,
  Database,
  Award,
  Sparkles,
  Bot,
  ChevronRight
} from 'lucide-react';

export const AIAgentsSection = () => {
  const [selectedAgent, setSelectedAgent] = useState(0);

  const agents = [
    {
      id: 'planner',
      name: 'Planner Agent',
      icon: Compass,
      color: 'text-blue-400',
      badge: 'ORCHESTRATOR',
      purpose: 'Determines which analysis agents should run based on incident severity and available telemetry types.',
      analyzes: ['Incident Severity (P0-P3)', 'Telemetry Coverage', 'Agent Dispatch Strategy', 'Execution Timeout Rules'],
    },
    {
      id: 'log',
      name: 'Log Analysis Agent',
      icon: FileText,
      color: 'text-cyan-400',
      badge: 'LOGS & ERRORS',
      purpose: 'Analyzes log volume, error frequencies, top repeating error patterns, affected modules, and timeline windows.',
      analyzes: ['Error Counts & Rates', 'Top Error Snippets', 'Module / Service Attribution', 'Log Level Distribution'],
    },
    {
      id: 'trace',
      name: 'Trace Analysis Agent',
      icon: Activity,
      color: 'text-indigo-400',
      badge: 'APM TRACES',
      purpose: 'Evaluates P95/P99 latency degradation, slowest API endpoints, HTTP status distribution, and span bottlenecks.',
      analyzes: ['P95 & P99 Latency Spikes', 'Slowest Endpoints', 'Span Execution Graphs', 'Downstream DB/HTTP Calls'],
    },
    {
      id: 'exception',
      name: 'Exception Analysis Agent',
      icon: Bug,
      color: 'text-rose-400',
      badge: 'STACK TRACES',
      purpose: 'Isolates uncaught exceptions, stack traces, failing source files, exact line numbers, and root error chains.',
      analyzes: ['Unhandled Exceptions', 'Stack Trace Frames', 'Source Files & Functions', 'Exception Frequency Matrix'],
    },
    {
      id: 'metrics',
      name: 'Metrics Agent',
      icon: LineChart,
      color: 'text-amber-400',
      badge: 'INFRASTRUCTURE',
      purpose: 'Monitors CPU usage, RAM memory pressure, JVM/Node heap allocation, disk I/O, and throughput anomalies.',
      analyzes: ['CPU & Memory Spikes', 'Heap Exhaustion', 'Network I/O Throughput', 'Resource Threshold Breaches'],
    },
    {
      id: 'deployment',
      name: 'Deployment Agent',
      icon: GitCommit,
      color: 'text-purple-400',
      badge: 'RELEASES',
      purpose: 'Correlates recent code deployments, git commits, authors, and release timestamps with incident onset.',
      analyzes: ['Git Commit Hashes', 'Release Timestamps', 'Commit Author & Message', 'Feature Flag Changes'],
    },
    {
      id: 'rag',
      name: 'RAG Agent',
      icon: Database,
      color: 'text-emerald-400',
      badge: 'VECTOR KNOWLEDGE',
      purpose: 'Performs semantic vector search across ChromaDB to retrieve historical incident RCAs and resolution runbooks.',
      analyzes: ['ChromaDB Embedding Match', 'Past Resolution Runbooks', 'Historical Symptom Similarity', 'Proven Fix Steps'],
    },
    {
      id: 'confidence',
      name: 'Confidence Agent',
      icon: Award,
      color: 'text-yellow-400',
      badge: 'SCORING ENGINE',
      purpose: 'Evaluates evidence density, correlation strength, signal consistency, and produces a mathematically sound confidence score.',
      analyzes: ['Evidence Quality Index', 'Cross-Signal Correlation', 'False Positive Filtering', 'Final Confidence Score %'],
    },
    {
      id: 'final',
      name: 'Final RCA Agent',
      icon: Sparkles,
      color: 'text-blue-400',
      badge: 'SYNTHESIZER',
      purpose: 'Synthesizes findings from all domain agents into a cohesive, developer-friendly Root Cause Analysis report.',
      analyzes: ['Executive Summary', 'Detailed Incident Timeline', 'Verified Root Cause', 'Actionable Fix & Prevention'],
    },
  ];

  const currentAgent = agents[selectedAgent];

  return (
    <section id="ai-agents" className="py-24 bg-[#0B1120] relative border-t border-[#263247]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Bot className="w-3.5 h-3.5" />
            <span>Multi-Agent AI Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            One Incident. Multiple Specialized Investigators.
          </h2>
          <p className="text-base text-slate-400">
            ObserveAI doesn&apos;t rely on a single generic AI prompt. Instead, a swarm of domain-specific AI agents collaborate to investigate every angle of production failures.
          </p>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left List of Agents (9 Cards) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {agents.map((agent, idx) => {
              const Icon = agent.icon;
              const isSelected = selectedAgent === idx;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(idx)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-[120px] ${
                    isSelected
                      ? 'bg-[#172033] border-blue-500 ring-1 ring-blue-500/50 shadow-xl scale-[1.02]'
                      : 'bg-[#172033]/50 border-[#263247] hover:border-slate-700 hover:bg-[#172033]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
                      <Icon className={`w-4 h-4 ${agent.color}`} />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {agent.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-100 truncate mb-1">
                      {agent.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {agent.purpose}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detailed Agent Panel */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#172033] border border-[#263247] shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-[#263247]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  {React.createElement(currentAgent.icon, { className: `w-6 h-6 ${currentAgent.color}` })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{currentAgent.name}</h3>
                  <span className="text-xs font-mono text-cyan-400">{currentAgent.badge} SPECIALIST</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Agent Purpose & Responsibility
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-[#0B1120] p-4 rounded-xl border border-[#263247]">
                {currentAgent.purpose}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Key Telemetry Analyzed
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentAgent.analyzes.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#0B1120] border border-[#263247] flex items-center gap-2 text-xs font-mono text-slate-300"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
