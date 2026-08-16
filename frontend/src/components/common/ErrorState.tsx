import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { NormalizedError } from '@/api/client';

interface ErrorStateProps {
  error?: NormalizedError | Error | string | null;
  title?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Unable to load data',
  onRetry,
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  let message = 'An unexpected error occurred while communicating with ObserveAI servers.';
  let errorCode = 'ERR_UNKNOWN';
  let details: any = null;

  if (typeof error === 'string') {
    message = error;
  } else if (error && 'message' in error) {
    message = error.message;
    if ('errorCode' in error) {
      errorCode = (error as NormalizedError).errorCode;
      details = (error as NormalizedError).details;
    }
  }

  return (
    <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-base text-rose-950 dark:text-rose-100">{title}</h4>
            <p className="text-sm text-rose-700 dark:text-rose-300 mt-0.5">{message}</p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>

      {(errorCode !== 'ERR_UNKNOWN' || details) && (
        <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="inline-flex items-center gap-1 text-xs font-mono font-medium text-rose-600 dark:text-rose-400 hover:underline"
          >
            {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Diagnostic Code: {errorCode}
          </button>

          {isDetailsExpanded && details && (
            <pre className="mt-2 p-3 rounded-lg bg-rose-950/80 text-rose-200 text-xs font-mono overflow-x-auto border border-rose-800/50 max-h-48">
              {JSON.stringify(details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
