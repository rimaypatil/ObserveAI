import React from 'react';
import { ShieldCheck, Key, Lock, Layers, Server } from 'lucide-react';

export const SecuritySection = () => {
  const securityFeatures = [
    {
      title: 'API-Key SDK Authentication',
      desc: 'All SDK telemetry ingestion endpoints require project-scoped API key header validation.',
      icon: Key,
    },
    {
      title: 'Cryptographic Password Hashing',
      desc: 'API ingestion keys and user secrets are salted and hashed in PostgreSQL using bcrypt.',
      icon: Lock,
    },
    {
      title: 'JWT Bearer Authentication',
      desc: 'Platform users authenticate via secure JWT access tokens with strict expiration control.',
      icon: ShieldCheck,
    },
    {
      title: 'Project & Org Isolation',
      desc: 'Telemetry, incidents, and RCA reports are strictly isolated per project workspace.',
      icon: Layers,
    },
  ];

  return (
    <section className="py-20 bg-[#0B1120] relative border-t border-[#263247]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Security Standards</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Security & Data Protection Built-In
          </h2>
          <p className="text-base text-slate-400">
            ObserveAI enforces strict security policies for SDK data ingestion and user session management.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#172033] border border-[#263247] space-y-3 shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
