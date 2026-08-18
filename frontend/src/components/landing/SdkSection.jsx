import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Check, Copy, Key, ArrowRight, Server, Database, AlertOctagon } from 'lucide-react';

export const SdkSection = () => {
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const installCmd = 'npm install github:ShivangiP2005/observai-sdk';

  const nodeSnippet = `const { ObserveAIClient } = require('observai-sdk');
const client = new ObserveAIClient({ apiKey: 'obs_live_xxx', serviceName: 'checkout-service' });
app.use(client.expressMiddleware());`;

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(installCmd);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(nodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const configOptions = [
    { name: 'apiKey', required: true, default: 'None', desc: 'Required. Your ObserveAI project API key generated in the dashboard.' },
    { name: 'serviceName', required: true, default: 'None', desc: 'Required. Microservice identifier (e.g. "payment-service").' },
    { name: 'endpointUrl', required: false, default: 'http://localhost:8000/api/v1/sdk/ingest', desc: 'Optional. Backend ingestion URL.' },
    { name: 'environment', required: false, default: "'production'", desc: 'Optional. Deployment environment ("development" | "staging" | "production").' },
  ];

  return (
    <section id="sdk" className="py-24 bg-[#0B1120] relative border-t border-[#263247]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer-First Integration</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Install the SDK, add 3 lines of code with your API key, and telemetry starts flowing automatically.
          </h2>
          <p className="text-base text-slate-400">
            Plug the official ObserveAI Node.js SDK into your existing services with zero friction.
          </p>
        </div>

        {/* 3-Step Setup Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Step 1: Install */}
          <div className="p-6 rounded-3xl bg-[#172033] border border-[#263247] space-y-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                  STEP 1
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  GitHub Package
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                Install SDK Package
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Install directly from the GitHub repository via npm.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#263247] flex items-center justify-between font-mono text-xs text-emerald-400">
              <span className="truncate mr-2">{installCmd}</span>
              <button
                onClick={handleCopyInstall}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                title="Copy package command"
              >
                {copiedInstall ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 2: Configure API Key */}
          <div className="p-6 rounded-3xl bg-[#172033] border border-[#263247] space-y-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold inline-block">
                STEP 2
              </span>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                Configure Ingestion Key
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an API key in your ObserveAI dashboard and initialize the client.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#263247] font-mono text-xs text-amber-400 overflow-x-auto">
              <code>apiKey: &apos;obs_live_xxx&apos;</code>
            </div>
          </div>

          {/* Step 3: Initialize Middleware */}
          <div className="p-6 rounded-3xl bg-[#172033] border border-[#263247] space-y-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold inline-block">
                STEP 3
              </span>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" />
                Attach Express Middleware
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add <code className="text-cyan-400">app.use(client.expressMiddleware())</code> to start streaming telemetry automatically.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/register"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
              >
                Create Your First Project
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Code Snippet Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#172033] border border-[#263247] shadow-2xl space-y-4 mb-12">
          <div className="flex items-center justify-between pb-4 border-b border-[#263247]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-400 ml-2">
                app.js
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1120] hover:bg-slate-800 border border-[#263247] text-xs font-mono text-slate-300 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied Snippet' : 'Copy Code'}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B1120] border border-[#263247] font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto">
            <pre>{nodeSnippet}</pre>
          </div>
        </div>

        {/* Configuration Reference & Additional Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Config Options Table (Left 8 cols) */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-[#172033] border border-[#263247] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              SDK Configuration Options
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#263247] text-slate-400">
                    <th className="pb-3 font-semibold">Option</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Default</th>
                    <th className="pb-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263247]/60">
                  {configOptions.map((opt, idx) => (
                    <tr key={idx} className="text-slate-300">
                      <td className="py-3 font-bold text-blue-400">{opt.name}</td>
                      <td className="py-3 text-slate-400">{opt.required ? 'String (Req)' : 'String'}</td>
                      <td className="py-3 text-emerald-400 text-[11px]">{opt.default}</td>
                      <td className="py-3 text-slate-300 font-sans text-xs">{opt.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Built-in Features (Right 4 cols) */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#172033] border border-[#263247] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Built-in Automatic Tracing
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#0B1120] border border-[#263247] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Database className="w-4 h-4" />
                  Mongoose / MongoDB Tracing
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically instruments Mongoose query execution times, slow queries, and database exceptions.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B1120] border border-[#263247] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <AlertOctagon className="w-4 h-4" />
                  Automatic Express Error Handler
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Attach <code className="text-rose-400 font-mono">expressErrorHandler()</code> to capture unhandled HTTP 5xx errors and stack traces.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
