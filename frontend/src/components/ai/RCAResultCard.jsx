import React, { useState } from 'react';
import { EvidenceList } from './EvidenceList';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react';
import { incidentsApi } from '@/api/incidents';
import { clsx } from 'clsx';

export const RCAResultCard = ({ rcaReport, incidentId }) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!rcaReport) return null;

  const hasScore = rcaReport.confidence_score != null;
  const score = hasScore ? Math.round(rcaReport.confidence_score * 100) : null;
  const confidenceLevel = rcaReport.confidence_level || (hasScore ? (score >= 85 ? 'HIGH' : score >= 65 ? 'MEDIUM' : 'LOW') : 'MEDIUM');

  const confidenceBadgeStyles = {
    HIGH: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    LOW: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  };

  const handleFeedback = async (isHelpful) => {
    try {
      if (incidentId) {
        await incidentsApi.submitFeedback(incidentId, { is_helpful: isHelpful });
      }
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Failed to submit RCA feedback:', err);
      setFeedbackSubmitted(true);
    }
  };

  const timeline = rcaReport.timeline_json || [];
  const fixRecommendations = rcaReport.fix_recommendations_json || [];
  const preventionActions = rcaReport.prevention_actions_json || [];

  return (
    <div className="space-y-6">
      {/* Primary Root Cause Highlight Banner */}
      <div className="p-6 rounded-2xl border border-brand-200 dark:border-brand-900/60 bg-gradient-to-br from-brand-50/50 via-white to-slate-50 dark:from-brand-950/30 dark:via-slate-900 dark:to-slate-900/80 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold shadow-lg shadow-brand-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                AI Autonomous Root Cause Analysis
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {rcaReport.root_cause}
              </h2>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Confidence Score</p>
              <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {hasScore ? `${score}%` : 'N/A'}
              </p>
            </div>
            <span
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-mono font-bold border uppercase',
                confidenceBadgeStyles[confidenceLevel] || confidenceBadgeStyles.HIGH
              )}
            >
              {confidenceLevel} CONFIDENCE
            </span>
          </div>
        </div>

        {/* RCA Executive Summary */}
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {rcaReport.summary}
        </p>

        {hasScore && score < 70 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>AI found a probable cause, but additional telemetry is recommended before applying full rollback.</span>
          </div>
        )}
      </div>

      {/* Supporting Evidence Breakdown */}
      <EvidenceList evidence={rcaReport.evidence_json} />

      {/* Incident Reconstruction Timeline */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-500" />
          Incident Reconstruction Timeline
        </h4>

        {timeline.length > 0 ? (
          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 relative pl-8">
                <div className="w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900 absolute left-2 top-1" />
                <div>
                  <span className="text-[11px] font-mono font-semibold text-brand-600 dark:text-brand-400">
                    {item.time || item.timestamp || `Step ${idx + 1}`}
                  </span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {item.event || item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No timeline events recorded for this incident.</p>
        )}
      </div>

      {/* Recommended Fixes & Prevention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fixes */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Recommended Immediate Actions
          </h4>
          {fixRecommendations.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {fixRecommendations.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-brand-500 font-bold">{idx + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No immediate action recommendations available.</p>
          )}
        </div>

        {/* Prevention */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Long-Term Prevention Measures
          </h4>
          {preventionActions.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {preventionActions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No long-term prevention measures available.</p>
          )}
        </div>
      </div>

      {/* RCA Feedback Widget */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Was this Root Cause Analysis helpful?
        </span>

        {feedbackSubmitted ? (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Thank you for your feedback!
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFeedback(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 transition-colors"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Yes
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 transition-colors"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
