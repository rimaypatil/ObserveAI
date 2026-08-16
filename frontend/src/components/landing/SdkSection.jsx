import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Check, Copy, Key, ArrowRight, Server } from 'lucide-react';

export const SdkSection = () => {
  const [selectedTech, setSelectedTech] = useState('nodejs');
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const installCmdNode = 'npm install observeai-sdk';
  const installCmdPy = 'pip install observeai-sdk';

  const activeInstall = selectedTech === 'nodejs' ? installCmdNode : installCmdPy;

  const nodeSnippet = `const { ObserveAIClient } = require("observeai-sdk");

// Initialize ObserveAI SDK
const sdk = new ObserveAIClient({
  apiKey: process.env.OBSERVEAI_API_KEY,
  serviceName: "payment-service",
  endpointUrl: "https://api.observeai.dev/api/v1/sdk/ingest"
});

// Attach Express telemetry middleware (captures logs, traces & exceptions)
app.use(sdk.expressMiddleware());`;

  const pythonSnippet = `from observeai_sdk import ObserveAISDKClient

# Initialize ObserveAI SDK
sdk = ObserveAISDKClient(
    api_key="OBSERVEAI_API_KEY",
    service_name="payment-service",
    endpoint_url="https://api.observeai.dev/api/v1/sdk/ingest"
)

# Capture error log signal with custom attributes
sdk.capture_log("ERROR", "Database connection pool timeout", attributes={"pool_size": 50})`;

  const activeSnippet = selectedTech === 'nodejs' ? nodeSnippet : pythonSnippet;

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(activeInstall);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
            Add Observability Without Rebuilding Your Application.
          </h2>
          <p className="text-base text-slate-400">
            Plug the ObserveAI SDK into your existing backend services with minimal lines of code and immediate telemetry capture.
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
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSelectedTech('nodejs')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedTech === 'nodejs'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    onClick={() => setSelectedTech('python')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedTech === 'python'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                Install SDK Package
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add the official ObserveAI SDK to your application dependencies via package manager.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#263247] flex items-center justify-between font-mono text-xs text-emerald-400">
              <span>{activeInstall}</span>
              <button
                onClick={handleCopyInstall}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
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
                Generate an API key in your ObserveAI dashboard and pass it via environment variables.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#263247] font-mono text-xs text-amber-400 overflow-x-auto">
              <code>OBSERVEAI_API_KEY=obs_live_9f83a...</code>
            </div>
          </div>

          {/* Step 3: Initialize */}
          <div className="p-6 rounded-3xl bg-[#172033] border border-[#263247] space-y-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold inline-block">
                STEP 3
              </span>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" />
                Stream Telemetry Signals
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Initialize client and auto-capture logs, trace spans, HTTP metrics, and unhandled exceptions.
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
        <div className="p-6 sm:p-8 rounded-3xl bg-[#172033] border border-[#263247] shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#263247]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-400 ml-2">
                {selectedTech === 'nodejs' ? 'server.js' : 'main.py'}
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
            <pre>{activeSnippet}</pre>
          </div>
        </div>
      </div>
    </section>
  );
};
