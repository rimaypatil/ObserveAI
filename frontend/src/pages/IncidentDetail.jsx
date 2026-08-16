import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentsApi } from '@/api/incidents';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { Badge } from '@/components/common/Badge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { InvestigationProgress } from '@/components/ai/InvestigationProgress';
import { RCAResultCard } from '@/components/ai/RCAResultCard';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  MessageSquare,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';

export const IncidentDetail = () => {
  const { incidentId } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchDetails = async () => {
    if (!incidentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await incidentsApi.getIncidentDetails(incidentId);
      setIncident(data);
    } catch (err) {
      console.error('Failed to load incident detail:', err);
      setError(err);
      setIncident(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [incidentId]);

  const handleReanalyzeAI = () => {
    setIsReanalyzing(true);
    setTimeout(() => {
      setIsReanalyzing(false);
      fetchDetails();
    }, 2500);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !incidentId) return;

    setIsSubmittingComment(true);
    try {
      const added = await incidentsApi.addComment(incidentId, newComment.trim());
      setIncident(prev => ({
        ...prev,
        comments: [...(prev?.comments || []), added],
      }));
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!incidentId) return;
    try {
      const updated = await incidentsApi.updateStatus(incidentId, { status: newStatus });
      setIncident(prev => ({ ...prev, status: updated.status }));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (isLoading) {
    return <LoadingState label="Retrieving incident telemetry & multi-agent AI RCA..." type="skeleton" count={4} />;
  }

  if (!incident) {
    return <ErrorState title="Incident not found" onRetry={fetchDetails} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation Back Button */}
      <button
        onClick={() => navigate('/incidents')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Incidents
      </button>

      {/* Incident Header Summary Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3">
              <SeverityBadge severity={incident.severity} size="md" />
              <Badge variant={incident.status === 'RESOLVED' ? 'success' : 'warning'}>
                {incident.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {incident.title}
            </h1>
            {incident.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {incident.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReanalyzeAI}
              disabled={isReanalyzing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              <Bot className="w-4 h-4" />
              {isReanalyzing ? 'AI Re-Analyzing...' : 'Investigate with AI'}
            </button>

            {incident.status !== 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                className="px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-colors"
              >
                Mark Resolved
              </button>
            )}
          </div>
        </div>

        {/* Metadata Details */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <Server className="w-4 h-4 text-brand-500" />
            <span>Service: <strong className="text-slate-800 dark:text-slate-200">{incident.service_name || incident.service?.name || 'N/A'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Started: <strong className="text-slate-800 dark:text-slate-200 font-mono">{new Date(incident.started_at).toLocaleTimeString()}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Environment: <strong className="text-slate-800 dark:text-slate-200 uppercase font-mono">{incident.environment || 'N/A'}</strong></span>
          </div>
        </div>
      </div>

      {/* Multi-Agent AI Pipeline Progress Visualization */}
      <InvestigationProgress
        executedAgents={incident.rca_report?.reasoning_tree_json?.executed_agents || []}
        isAnalyzing={isReanalyzing || incident.status === 'AI_PROCESSING'}
      />

      {/* Primary Evidence-First AI Root Cause Analysis Result */}
      {incident.rca_report && (
        <RCAResultCard rcaReport={incident.rca_report} incidentId={incident.id} />
      )}

      {/* Related Telemetry Navigation Quick Links */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Correlated Incident Data Views
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/logs')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
          >
            <FileText className="w-3.5 h-3.5 text-teal-500" />
            View Filtered Logs
          </button>
          <button
            onClick={() => navigate('/metrics')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            View Latency Metrics
          </button>
        </div>
      </div>

      {/* Comments & Collaboration Timeline */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-500" />
          Incident Notes & Comments
        </h3>

        <div className="space-y-3">
          {incident.comments && incident.comments.length > 0 ? (
            incident.comments.map(c => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                  <span>User {c.user_id?.slice(0, 8)}</span>
                  <span>{new Date(c.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200">{c.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No notes added yet.</p>
          )}
        </div>

        <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Add investigation note or update..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={isSubmittingComment || !newComment.trim()}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            Post Note
          </button>
        </form>
      </div>
    </div>
  );
};
