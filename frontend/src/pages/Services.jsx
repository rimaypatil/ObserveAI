import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { projectsApi } from '@/api/projects';
import { ServiceMap } from '@/components/services/ServiceMap';
import { Badge } from '@/components/common/Badge';
import { LoadingState } from '@/components/common/LoadingState';
import { Activity, CheckCircle2, Clock, Cpu, RefreshCw, Server, ShieldAlert } from 'lucide-react';

export const Services = () => {
  const { activeProject } = useProject();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = async () => {
    if (!activeProject) return;
    setIsLoading(true);

    try {
      const data = await projectsApi.listServices(activeProject.id);
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [activeProject]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Server className="w-6 h-6 text-brand-500" />
            Auto-Discovered Microservices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time topology health, active incident counts, and OpenTelemetry instrumentation
          </p>
        </div>

        <button
          onClick={fetchServices}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Topology
        </button>
      </div>

      {/* Interactive Topology Graph */}
      <ServiceMap realServices={services} />

      {/* Services List Cards */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          Service Health Inventory
        </h3>

        {isLoading ? (
          <LoadingState type="card" count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 hover:border-brand-500/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      service.is_healthy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {service.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">
                        {service.type || 'backend'}
                      </p>
                    </div>
                  </div>

                  <Badge variant={service.is_healthy ? 'success' : 'error'}>
                    {service.is_healthy ? 'HEALTHY' : 'CRITICAL'}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    {service.last_seen_at ? new Date(service.last_seen_at).toLocaleTimeString() : 'Just now'}
                  </span>

                  <span className="font-semibold text-brand-500">
                    {service.is_healthy ? '0 Active Incidents' : '1 Active Incident'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
