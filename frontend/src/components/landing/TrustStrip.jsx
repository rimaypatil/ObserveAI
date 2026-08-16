import React from 'react';
import { Activity, Bot, Cpu, History, Terminal } from 'lucide-react';

export const TrustStrip = () => {
  const valueItems = [
    {
      title: 'Real-time Telemetry',
      desc: 'Ingest logs, traces, exceptions, metrics & deployments seamlessly',
      icon: Activity,
      color: 'text-blue-400',
    },
    {
      title: 'AI-Powered RCA',
      desc: 'Autonomous incident analysis pinpointing precise root causes',
      icon: Bot,
      color: 'text-cyan-400',
    },
    {
      title: 'Multi-Agent Analysis',
      desc: 'Domain-specific specialized AI agents collaborating in parallel',
      icon: Cpu,
      color: 'text-purple-400',
    },
    {
      title: 'Historical RCA RAG',
      desc: 'ChromaDB vector search across past incident reports and runbooks',
      icon: History,
      color: 'text-indigo-400',
    },
    {
      title: 'Developer-Friendly SDK',
      desc: 'Zero-friction integration for Node.js and Python microservices',
      icon: Terminal,
      color: 'text-emerald-400',
    },
  ];

  return (
    <section id="trust" className="py-12 bg-[#0B1120] border-y border-[#263247]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">
          Built for modern engineering teams & autonomous operations
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {valueItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#172033]/60 border border-[#263247] hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-[#263247] flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
