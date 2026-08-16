import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Cpu, Activity, AlertTriangle, RefreshCw } from 'lucide-react';

export const Metrics = () => {
  const { activeProject } = useProject();

  const latencyData = [
    { time: '10:00', p50: 42, p95: 180, p99: 450 },
    { time: '10:10', p50: 45, p95: 190, p99: 460 },
    { time: '10:20', p50: 48, p95: 210, p99: 480 },
    { time: '10:30', p50: 50, p95: 220, p99: 500 },
    { time: '10:40', p50: 120, p95: 1400, p99: 3800 },
    { time: '10:45', p50: 250, p95: 4200, p99: 7500 },
    { time: '10:50', p50: 180, p95: 2800, p99: 5200 },
    { time: '11:00', p50: 52, p95: 240, p99: 510 },
  ];

  const throughputData = [
    { time: '10:00', req: 1200, err: 5 },
    { time: '10:10', req: 1350, err: 4 },
    { time: '10:20', req: 1400, err: 6 },
    { time: '10:30', req: 1380, err: 5 },
    { time: '10:40', req: 2800, err: 142 },
    { time: '10:45', req: 3100, err: 185 },
    { time: '10:50', req: 2400, err: 98 },
    { time: '11:00', req: 1450, err: 8 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-brand-500" />
          Metrics & Infrastructure Signals
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          High-resolution latency percentiles, error rate trends, and connection pool saturation metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latency Percentiles Chart */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-500" />
              Request Latency Percentiles (ms)
            </h3>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">P50 • P95 • P99</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="p99" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                <Area type="monotone" dataKey="p95" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                <Area type="monotone" dataKey="p50" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput & Error Volume Chart */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Request Volume vs Error Volume
            </h3>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">req/min</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="req" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="err" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
