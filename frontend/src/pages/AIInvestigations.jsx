import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { incidentsApi } from '@/api/incidents';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Bot, ChevronRight, Clock, ShieldCheck, Zap } from 'lucide-react';

export const AIInvestigations = () => {
  const { activeProject } = useProject();
  const [investigations, setInvestigations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeProject) return;
      setIsLoading(true);

      try {
        const incidents = await incidentsApi.listIncidents({
          project_id: activeProject.id,
          limit: 50,
        });
        setInvestigations(incidents.filter(i => i.root_cause_summary || i.status === 'INVESTIGATING'));
      } catch (err) {
        console.error('Failed to fetch AI investigations:', err);
        setInvestigations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [activeProject]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-brand-500" />
          Autonomous AI Investigation Audit Log
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Historical record of multi-agent RCA runs, confidence metrics, and evidence analysis
        </p>
      </div>

      {investigations.length > 0 ? (
        <div className="space-y-3">
          {investigations.map((item) => {
            const score = Math.round((item.confidence_score || 0.9) * 100);

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/incidents/${item.id}`)}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 transition-all cursor-pointer shadow-sm flex flex-wrap items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 max-w-2xl">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                    <Bot className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors">
                        {item.title}
                      </span>
                      <Badge variant="primary">9-Agent RCA</Badge>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {item.root_cause_summary || 'Autonomous root cause under multi-agent analysis'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Confidence</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{score}%</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-brand-500 font-semibold group-hover:translate-x-0.5 transition-transform">
                    View RCA
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No AI investigations yet."
          description="Investigate your first incident to see ObserveAI's autonomous RCA engine in action."
          icon={Bot}
        />
      )}
    </div>
  );
};
