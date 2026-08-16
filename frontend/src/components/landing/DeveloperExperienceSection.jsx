import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Server, BookOpen, Layers, Terminal, Sparkles, ArrowRight } from 'lucide-react';

export const DeveloperExperienceSection = () => {
  const dxPoints = [
    {
      title: 'API-First Architecture',
      desc: 'Clean REST endpoints for telemetry ingestion, incident queries, and RCA retrieval.',
      icon: Code2,
    },
    {
      title: 'OpenAPI & Swagger Specs',
      desc: 'Interactive documentation for easy API testing and SDK customization.',
      icon: BookOpen,
    },
    {
      title: 'Project Organization',
      desc: 'Group microservices and isolate environment keys per project.',
      icon: Layers,
    },
    {
      title: 'Service-Level Telemetry',
      desc: 'Attribute errors, traces, and metrics directly to responsible microservices.',
      icon: Server,
    },
    {
      title: 'AI Incident Investigation',
      desc: 'Trigger autonomous multi-agent root cause analysis on demand.',
      icon: Sparkles,
    },
    {
      title: 'Historical Knowledge Base',
      desc: 'ChromaDB vector store indexed for instant historical incident retrieval.',
      icon: Terminal,
    },
  ];

  return (
    <section id="dx" className="py-24 bg-[#0B1120] relative border-t border-[#263247]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <span>Developer-First Platform</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Built for Developers & DevOps Engineers
          </h2>
          <p className="text-base text-slate-400">
            Designed to integrate smoothly into modern CI/CD pipelines, container environments, and microservice architectures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {dxPoints.map((point, idx) => {
            const Icon = point.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#172033] border border-[#263247] hover:border-cyan-500/40 transition-all duration-200 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100">{point.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{point.desc}</p>
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-[#172033] to-cyan-900/40 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold text-slate-100">Ready to automate root cause analysis?</h3>
            <p className="text-xs text-slate-300">
              Create an organization account and connect your first microservice via SDK in minutes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-5 py-3 rounded-xl bg-[#0B1120] hover:bg-slate-800 border border-[#263247] text-slate-300 font-semibold text-sm transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
