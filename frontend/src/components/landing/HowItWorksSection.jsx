import React from 'react';
import {
  Code,
  Radio,
  ShieldAlert,
  Bot,
  Database,
  Award,
  Sparkles,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

export const HowItWorksSection = () => {
  const steps = [
    {
      num: '01',
      title: 'Connect SDK',
      desc: 'Developer integrates the lightweight ObserveAI SDK into their Node.js or Python application in under 2 minutes.',
      icon: Code,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      num: '02',
      title: 'Send Telemetry',
      desc: 'The SDK streams real-time logs, exceptions, distributed traces, system metrics, and deployment events to the ingestion API.',
      icon: Radio,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      num: '03',
      title: 'Detect Anomalies',
      desc: 'ObserveAI evaluates incoming telemetry and automatically triggers incidents on error spikes, uncaught exceptions, or latency breaches.',
      icon: ShieldAlert,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      num: '04',
      title: 'Multi-Agent Analysis',
      desc: 'Specialized domain agents (Planner, Log, Trace, Exception, Metrics, Deployment) run parallel diagnostics on incident evidence.',
      icon: Bot,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      num: '05',
      title: 'Retrieve RAG Context',
      desc: 'Vector search using ChromaDB searches past incident reports, resolution runbooks, and historical patterns for matching symptoms.',
      icon: Database,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      num: '06',
      title: 'Calculate Confidence',
      desc: 'The Confidence Engine evaluates evidence density, correlation factors, and signal reliability to produce an objective confidence score.',
      icon: Award,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      num: '07',
      title: 'Generate AI RCA',
      desc: 'The Final RCA Agent synthesizes all evidence into a structured report: root cause, timeline, proof, historical matches, and recommended fixes.',
      icon: Sparkles,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      num: '08',
      title: 'Continuous Learning',
      desc: 'Generated RCA reports are automatically indexed into the ChromaDB vector store, continuously improving future incident analysis.',
      icon: RefreshCw,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#0B1120] relative border-t border-[#263247]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>Step-By-Step Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            How ObserveAI Works
          </h2>
          <p className="text-base text-slate-400">
            From SDK telemetry streaming to vector-indexed historical intelligence, observe how autonomous AI agents correlate production signals.
          </p>
        </div>

        {/* 8-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#172033] border border-[#263247] hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-xl ${step.bg} border ${step.border} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${step.color}`} />
                    </div>
                    <span className="text-2xl font-extrabold font-mono text-slate-600 group-hover:text-blue-400 transition-colors">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-blue-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>STEP {idx + 1} OF 8</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
