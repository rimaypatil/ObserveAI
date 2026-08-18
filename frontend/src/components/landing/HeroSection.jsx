import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldAlert,
  FileText,
  Activity,
  Bug,
  GitCommit,
  Database,
  Sparkles,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

export const HeroSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Animated pipeline steps demonstrating autonomous root cause analysis
  const pipelineSteps = [
    {
      title: 'Incident Detected',
      desc: 'P1 Error spike & Latency anomaly detected in payment-service',
      icon: ShieldAlert,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      tag: 'AUTOMATIC TRIGGER'
    },
    {
      title: 'Logs Analyzed',
      desc: 'Log Agent identified 485 instances of DBConnectionPoolTimeout',
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      tag: 'LOG AGENT'
    },
    {
      title: 'Trace Bottleneck Identified',
      desc: 'Trace Agent detected P99 latency spikes on /v1/checkout (4,200ms)',
      icon: Activity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      tag: 'TRACE AGENT'
    },
    {
      title: 'Exception Correlated',
      desc: 'Exception Agent isolated connection acquisition timeout stack trace',
      icon: Bug,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      tag: 'EXCEPTION AGENT'
    },
    {
      title: 'Deployment Correlated',
      desc: 'Deployment Agent matched release v2.4.1 (commit #8f32a1)',
      icon: GitCommit,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      tag: 'DEPLOYMENT AGENT'
    },
    {
      title: 'Historical RCA Found',
      desc: 'RAG Agent matched similar incident from 3 months ago (94% similarity)',
      icon: Database,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      tag: 'CHROMA RAG'
    },
    {
      title: 'AI Root Cause Generated',
      desc: 'Database connection pool size exhausted under peak load. Recommended pool increase to 100.',
      icon: Sparkles,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-2 border-emerald-500/50',
      border: 'border-emerald-500/40',
      tag: 'FINAL RCA (87% CONFIDENCE)'
    }
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % pipelineSteps.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPaused, pipelineSteps.length]);

  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    const element = document.querySelector('#how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#0B1120]">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>Autonomous Root Cause Analysis Engine</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight leading-[1.15]">
            From Production Failure to Root Cause —{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Automatically.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
            ObserveAI monitors your application&apos;s telemetry, detects incidents, and uses autonomous AI agents to identify root causes and recommend fixes before your team has to dig through thousands of logs.
          </p>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-xl shadow-blue-600/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              Start Monitoring Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              onClick={scrollToHowItWorks}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#172033] hover:bg-slate-800 text-slate-200 border border-[#263247] font-semibold text-base transition-colors"
            >
              Explore How It Works
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Hero Visual Mockup: Real-Time Incident Pipeline */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="mt-14 max-w-5xl mx-auto rounded-2xl bg-[#172033] border border-[#263247] shadow-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-xl relative"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#263247]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
                observeai // autonomous-pipeline-active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className={`text-xs font-semibold ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isPaused ? 'Pipeline Paused (Manual Inspection)' : 'Live Agent Pipeline'}
              </span>
            </div>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 relative">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              const isPast = activeStep > idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveStep(idx);
                    setIsPaused(true);
                  }}
                  className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] ${
                    isActive
                      ? `${step.bg} ${step.border} ring-1 ring-blue-400/50 shadow-lg scale-[1.02]`
                      : isPast
                      ? 'bg-[#0B1120]/80 border-[#263247] opacity-90'
                      : 'bg-[#0B1120]/40 border-[#263247]/50 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg ${isActive ? step.bg : 'bg-slate-800'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? step.color : 'text-slate-400'}`} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">#0{idx + 1}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1 mb-1">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-400 truncate max-w-[90px]">
                      {step.tag}
                    </span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed View Card of Currently Selected Pipeline Step */}
          <div className="mt-6 p-4 rounded-xl bg-[#0B1120] border border-[#263247] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${pipelineSteps[activeStep].bg} border ${pipelineSteps[activeStep].border}`}>
                {React.createElement(pipelineSteps[activeStep].icon, {
                  className: `w-6 h-6 ${pipelineSteps[activeStep].color}`
                })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Step {activeStep + 1} of 7: {pipelineSteps[activeStep].title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {pipelineSteps[activeStep].tag}
                  </span>
                </div>
                <p className="text-sm text-slate-200 mt-0.5 font-mono">
                  {pipelineSteps[activeStep].desc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono self-end md:self-auto">
              <span>{isPaused ? 'Paused (hover off to resume)' : 'Auto-cycling simulation...'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
