import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { telemetryApi } from '@/api/telemetry';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Cpu, Activity, AlertTriangle, RefreshCw } from 'lucide-react';

export const Metrics = () => {
  const { activeProject } = useProject();
  const [latencyData, setLatencyData] = useState([]);
  const [throughputData, setThroughputData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!activeProject?.id) {
      setLatencyData([]);
      setThroughputData([]);
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      // Immediately reset data when switching projects to guarantee zero data leakage
      setLatencyData([]);
      setThroughputData([]);

      try {
        const [latencyRes, throughputRes] = await Promise.all([
          telemetryApi.getLatencyTimeseries(activeProject.id, 1),
          telemetryApi.getThroughputTimeseries(activeProject.id, 1),
        ]);

        if (!isMounted) return;

        // Safely extract arrays regardless of wrapping format
        const rawLatency = Array.isArray(latencyRes)
          ? latencyRes
          : Array.isArray(latencyRes?.data)
          ? latencyRes.data
          : [];

        const rawThroughput = Array.isArray(throughputRes)
          ? throughputRes
          : Array.isArray(throughputRes?.data)
          ? throughputRes.data
          : [];

        const formattedLatency = rawLatency
          .filter((item) => item && item.timestamp)
          .map((item) => {
            const d = new Date(item.timestamp);
            const timeStr = isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return {
              time: timeStr,
              p50: item.p50_ms,
              p95: item.p95_ms,
              p99: item.p99_ms,
            };
          })
          .filter((item) => item.time !== '');

        const formattedThroughput = rawThroughput
          .filter((item) => item && item.timestamp)
          .map((item) => {
            const d = new Date(item.timestamp);
            const timeStr = isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return {
              time: timeStr,
              req: item.request_count,
              err: item.error_count,
            };
          })
          .filter((item) => item.time !== '');

        setLatencyData(formattedLatency);
        setThroughputData(formattedThroughput);
      } catch (err) {
        console.error('Failed to fetch telemetry metrics:', err);
        if (isMounted) setError('Failed to fetch real telemetry metrics.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [activeProject?.id]);

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

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

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
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            ) : latencyData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Activity className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No latency telemetry available</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  Latency percentiles will appear here once trace telemetry is received.
                </p>
              </div>
            ) : (
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
            )}
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
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            ) : throughputData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No request telemetry available</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  Request and error volume will appear here once telemetry is received.
                </p>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
