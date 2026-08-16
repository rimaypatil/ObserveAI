import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  label?: string;
  type?: 'spinner' | 'skeleton' | 'card';
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading operational telemetry...',
  type = 'spinner',
  count = 3,
}) => {
  if (type === 'skeleton') {
    return (
      <div className="w-full space-y-4 animate-pulse" aria-label="Loading content">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse" aria-label="Loading cards">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400 space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
};
