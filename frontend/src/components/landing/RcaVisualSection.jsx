import React from 'react';
import {
  ShieldAlert,
  Award,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

export const RcaVisualSection = () => {
  return (
    <section className="py-24 bg-[#0B1120] relative border-t border-[#263247]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Output Preview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Comprehensive Root Cause Reports
          </h2>
          <p className="text-base text-slate-400">
            Here is what an AI-generated Root Cause Analysis report looks like when ObserveAI automatically investigates a production failure.
          </p>
        </div>

        {/* RCA Card Container */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-[#172033] border border-[#263247] shadow-2xl p-6 sm:p-8 space-y-8 relative overflow-hidden">
          {/* Top Label */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#263247]">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                SEVERITY P1
              </div>
              <span className="text-xs font-mono text-slate-400 bg-[#0B1120] px-3 py-1 rounded-lg border border-[#263247]">
                INCIDENT #INC-8924
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              <Award className="w-4 h-4" />
              CONFIDENCE SCORE: 87%
            </div>
          </div>

          {/* Incident Title & Root Cause Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
                Payment API failures & Checkout Timeout Spike
              </h3>
              <span className="text-xs font-mono px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Example AI-generated RCA
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B1120] border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                Identified Root Cause
              </div>
              <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                Database connection pool exhaustion caused payment requests to fail during high throughput checkout bursts.
              </p>
            </div>
          </div>

          {/* Evidence & Correlated Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Correlated Evidence Points */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Correlated Evidence (5 Signals)
              </h4>
              <ul className="space-y-2">
                {[
                  'Error spike detected: 485 DBConnectionTimeout errors in 5 mins',
                  'HTTP 500 response rate increased to 24.8% on /v1/checkout',
                  'Database-related exceptions detected in connection pool manager',
                  'P99 API latency increased from 180ms to 4,200ms',
                  'Recent deployment correlated: Release v2.4.1 (commit #8f32a1)'
                ].map((item, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl bg-[#0B1120] border border-[#263247] text-xs font-mono text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Recommendations & Historical Match */}
            <div className="space-y-6">
              {/* Recommendations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Recommended Fix Actions
                </h4>
                <div className="space-y-2">
                  {[
                    '1. Increase database connection pool capacity from 30 to 100.',
                    '2. Review connection lifecycle & ensure connections release after query.',
                    '3. Add pool exhaustion alerts & queue depth monitoring.',
                    '4. Validate release v2.4.1 connection management settings.'
                  ].map((rec, rIdx) => (
                    <div key={rIdx} className="p-2.5 rounded-xl bg-[#0B1120] border border-[#263247] text-xs font-mono text-emerald-300">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical Match Preview */}
              <div className="p-3.5 rounded-2xl bg-[#0B1120] border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">Historical Incident Match</h5>
                    <p className="text-[11px] text-slate-400">Similar payment-service incident (94% Chroma vector match)</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-indigo-400 font-bold">RAG FOUND</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
