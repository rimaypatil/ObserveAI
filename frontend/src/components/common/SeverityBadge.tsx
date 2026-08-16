import React from 'react';
import { SeverityType } from '@/types/api';
import { AlertOctagon, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

interface SeverityBadgeProps {
  severity: SeverityType | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showLabel = true,
}) => {
  const normalized = (severity || 'P2').toUpperCase();

  const config: Record<string, { label: string; icon: React.ElementType; styles: string }> = {
    P0: {
      label: 'P0 Critical',
      icon: ShieldAlert,
      styles: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:bg-rose-950/50',
    },
    P1: {
      label: 'P1 High',
      icon: AlertOctagon,
      styles: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 dark:bg-orange-950/50',
    },
    P2: {
      label: 'P2 Medium',
      icon: AlertTriangle,
      styles: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:bg-amber-950/50',
    },
    P3: {
      label: 'P3 Low',
      icon: Info,
      styles: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 dark:bg-blue-950/50',
    },
  };

  const current = config[normalized] || config.P2;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    lg: 'px-3 py-1.5 text-sm gap-2 font-semibold',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md border font-mono uppercase tracking-wider',
        current.styles,
        sizeClasses[size]
      )}
      aria-label={`Severity Level ${current.label}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'} />
      {showLabel ? current.label : normalized}
    </span>
  );
};
