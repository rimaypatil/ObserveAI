import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { projectsApi } from '@/api/projects';
import { Check, Copy, Key, Server, Terminal, ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';

export const SdkOnboardingStep = () => {
  const { activeProject } = useProject();
  const [selectedTech, setSelectedTech] = useState('nodejs');
  const [keyName, setKeyName] = useState('Service Ingestion Key');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!activeProject) return;

    setIsGenerating(true);
    try {
      const res = await projectsApi.createApiKey(activeProject.id, {
        name: keyName,
        environment: activeProject.environment || 'production',
      });
      setGeneratedKey(res.raw_key || 'observeai_live_' + Math.random().toString(36).substring(2, 15));
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to create API key:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const nodeCodeExample = `const { ObserveAIClient } = require("./sdk/observeai-sdk");

const sdk = new ObserveAIClient({
    apiKey: "${generatedKey || 'YOUR_OBSERVEAI_API_KEY'}",
    serviceName: "${activeProject?.name?.toLowerCase().replace(/\s+/g, '-') || 'my-service'}",
    endpointUrl: "http://127.0.0.1:8000/api/v1/sdk/ingest"
});

// Capture HTTP request telemetry, errors, and traces
app.use(sdk.expressMiddleware());`;

  const pythonCodeExample = `from backend.sdk.client import ObserveAISDKClient

sdk = ObserveAISDKClient(
    api_key="${generatedKey || 'YOUR_OBSERVEAI_API_KEY'}",
    service_name="${activeProject?.name?.toLowerCase().replace(/\s+/g, '-') || 'my-service'}",
    endpoint_url="http://127.0.0.1:8000/api/v1/sdk/ingest"
)

# Capture log signal
sdk.capture_log("ERROR", "Database connection pool timeout", attributes={"pool_size": 50})`;

  const activeCode = selectedTech === 'nodejs' ? nodeCodeExample : pythonCodeExample;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Onboarding Stepper Header */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-brand-500" />
          Connect Your Application via SDK
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Connect your microservices to ObserveAI to automatically ingest logs, uncaught exceptions, trace spans, and metric anomalies for AI Root Cause Analysis.
        </p>

        {/* Tech Selector */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setSelectedTech('nodejs')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedTech === 'nodejs'
                ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            Node.js (Express)
          </button>
          <button
            onClick={() => setSelectedTech('python')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedTech === 'python'
                ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            Python (FastAPI / Flask)
          </button>
        </div>
      </div>

      {/* Generate API Key Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-500" />
          Step 1: Generate SDK Ingestion API Key
        </h4>

        <form onSubmit={handleCreateApiKey} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key Name (e.g. Production Payment Key)"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1 min-w-[200px]"
          />
          <button
            type="submit"
            disabled={isGenerating || !activeProject}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate SDK Key'}
          </button>
        </form>

        {generatedKey && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs text-amber-400">
            <span className="truncate">{generatedKey}</span>
            <button
              onClick={handleCopyKey}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold transition-colors"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Code Integration Snippet */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-500" />
            Step 2: Install & Initialize SDK Code
          </h4>
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied Snippet' : 'Copy Code'}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
          <pre>{activeCode}</pre>
        </div>
      </div>

      {/* Raw API Key Display Modal (Displayed ONCE upon creation) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Copy Your SDK API Key"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span>Save this raw key now. It is hashed securely in database and will never be shown again!</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-amber-400 flex items-center justify-between">
            <span className="truncate">{generatedKey}</span>
            <button
              onClick={handleCopyKey}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 text-white font-semibold text-xs hover:bg-brand-600 transition-colors"
            >
              {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedKey ? 'Copied' : 'Copy Key'}
            </button>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Done & Dismiss
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
