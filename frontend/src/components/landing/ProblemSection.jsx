import React from 'react';
import { XCircle, CheckCircle, Clock, Zap, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export const ProblemSection = () => {
  const traditionalSteps = [
    '1. Error alert fires in production channel',
    '2. Engineer manually logs into multiple tools',
    '3. Greps through thousands of raw log entries',
    '4. Manually cross-checks APM trace latencies',
    '5. Queries metrics databases for CPU/RAM spikes',
    '6. Searches Git commit logs for recent deployments',
    '7. Asks team members if this happened before',
    '8. Trial and error testing potential bug fixes'
  ];

  const observeAiSteps = [
    { title: 'Telemetry Ingestion', desc: 'SDK streams logs, traces, exceptions, metrics' },
    { title: 'Anomaly Detection', desc: 'Automatic detection of error spikes & latencies' },
    { title: 'Specialized Multi-Agent RCA', desc: 'Planner, Log, Trace, Exception & Metric agents analyze' },
    { title: 'RAG Knowledge Search', desc: 'ChromaDB searches past incident runbooks' },
    { title: 'Confidence Scoring', desc: 'Evaluates evidence strength & reliability' },
    { title: 'Actionable RCA Report', desc: 'Root cause, timeline, exact fix & prevention steps' }
  ];

  return (
    <section id="features" className="py-20 bg-[#0B1120] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Eliminate Mean Time To Resolution (MTTR)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Production problems shouldn&apos;t require hours of investigation.
          </h2>
          <p className="text-base text-slate-400">
            When production breaks, developers waste valuable hours jumping across log aggregators, tracing tools, and metric dashboards trying to connect the dots.
          </p>
        </div>

        {/* Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: Traditional Workflow (Pain) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#172033]/40 border border-rose-500/20 relative space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#263247]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Traditional Manual Troubleshooting</h3>
                    <p className="text-xs text-rose-400 font-medium">Siloed tools, manual digging & trial-and-error</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  Hours Lost
                </span>
              </div>

              <ul className="space-y-3">
                {traditionalSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-400 font-mono">
                    <span className="text-rose-500 font-bold flex-shrink-0">✕</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-300/80 font-mono">
              Result: High MTTR, fatigued engineers, context switching, and delayed resolution.
            </div>
          </div>

          {/* Right: ObserveAI Workflow (Gain) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#172033] border border-blue-500/30 relative space-y-6 flex flex-col justify-between shadow-2xl shadow-blue-500/5">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#263247]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">ObserveAI Autonomous Engine</h3>
                    <p className="text-xs text-cyan-400 font-medium">Multi-agent correlation & automatic root cause</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Instant Insights
                </span>
              </div>

              <div className="space-y-3">
                {observeAiSteps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#0B1120] border border-[#263247] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{step.title}</h4>
                        <p className="text-[11px] text-slate-400">{step.desc}</p>
                      </div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 font-mono flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Result: Actionable RCA with confidence rating delivered automatically.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
