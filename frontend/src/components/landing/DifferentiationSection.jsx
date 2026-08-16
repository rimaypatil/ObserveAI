import React from 'react';
import { Layout, Zap, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

export const DifferentiationSection = () => {
  return (
    <section className="py-24 bg-[#0B1120] relative border-t border-[#263247]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>Architectural Differentiation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Why ObserveAI?
          </h2>
          <p className="text-base text-slate-400">
            ObserveAI is designed to reduce the investigation work between an incident and an actionable explanation.
          </p>
        </div>

        {/* Comparison Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Traditional Paradigm */}
          <div className="p-8 rounded-3xl bg-[#172033]/40 border border-[#263247] space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-800 text-slate-400">
                  <Layout className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Traditional Observability</h3>
                  <p className="text-xs text-slate-400">Dashboard-centric manual troubleshooting paradigm</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1120] border border-[#263247] font-mono text-xs text-slate-400 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>Telemetry Streaming</span>
                </div>
                <div className="pl-4 text-slate-500 font-bold">↓</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>Static Dashboard Visualizations</span>
                </div>
                <div className="pl-4 text-slate-500 font-bold">↓</div>
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Developer Manually Investigates Logs & Traces</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Traditional tools provide dashboards and graphs, but leave the heavy manual burden of correlation, hypothesis testing, and root cause diagnosis on engineers during stressful outages.
            </p>
          </div>

          {/* ObserveAI Paradigm */}
          <div className="p-8 rounded-3xl bg-[#172033] border border-blue-500/40 shadow-2xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">ObserveAI Autonomous Engine</h3>
                  <p className="text-xs text-cyan-400 font-medium">Telemetry to actionable intelligence pipeline</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1120] border border-blue-500/30 font-mono text-xs text-blue-300 space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Telemetry Streaming</span>
                </div>
                <div className="pl-4 text-blue-500 font-bold">↓</div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Automatic Anomaly Detection</span>
                </div>
                <div className="pl-4 text-blue-500 font-bold">↓</div>
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>Specialized Multi-Agent Domain Analysis</span>
                </div>
                <div className="pl-4 text-blue-500 font-bold">↓</div>
                <div className="flex items-center gap-2 text-indigo-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>Historical Vector Search (RAG)</span>
                </div>
                <div className="pl-4 text-blue-500 font-bold">↓</div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Confidence Scoring & AI RCA Generation</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              ObserveAI active agents automate telemetry correlation, query historical runbooks, and produce an actionable RCA report complete with confidence ratings and recommended resolution steps.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
