import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  RotateCw,
  CircleDashed,
  Lock,
} from 'lucide-react';
import { AccessibilityStatusType } from '../../types/accessibility';

export interface StatusBadgeProps {
  status: AccessibilityStatusType;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const statusConfig: Record<
    AccessibilityStatusType,
    { defaultLabel: string; icon: React.ReactNode; bgClass: string; textClass: string; borderClass: string }
  > = {
    success: {
      defaultLabel: 'Completed',
      icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
      bgClass: 'bg-status-success-bg',
      textClass: 'text-status-success',
      borderClass: 'border-status-success',
    },
    completed: {
      defaultLabel: 'Completed',
      icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
      bgClass: 'bg-status-success-bg',
      textClass: 'text-status-success',
      borderClass: 'border-status-success',
    },
    warning: {
      defaultLabel: 'Review Required',
      icon: <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />,
      bgClass: 'bg-status-warning-bg',
      textClass: 'text-status-warning',
      borderClass: 'border-status-warning',
    },
    error: {
      defaultLabel: 'Error Occurred',
      icon: <XCircle className="w-3.5 h-3.5" aria-hidden="true" />,
      bgClass: 'bg-status-error-bg',
      textClass: 'text-status-error',
      borderClass: 'border-status-error',
    },
    info: {
      defaultLabel: 'Information',
      icon: <Info className="w-3.5 h-3.5" aria-hidden="true" />,
      bgClass: 'bg-status-info-bg',
      textClass: 'text-status-info',
      borderClass: 'border-status-info',
    },
    in_progress: {
      defaultLabel: 'In Progress',
      icon: <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />,
      bgClass: 'bg-surface-elevated',
      textClass: 'text-primary',
      borderClass: 'border-primary',
    },
    not_started: {
      defaultLabel: 'Not Started',
      icon: <CircleDashed className="w-3.5 h-3.5" aria-hidden="true" />,
      bgClass: 'bg-surface',
      textClass: 'text-foreground-muted',
      borderClass: 'border-border-strong',
    },
    locked: {
      defaultLabel: 'Locked',
      icon: <Lock className="w-3.5 h-3.5" aria-hidden="true" />,
      bgClass: 'bg-surface-elevated',
      textClass: 'text-foreground-muted',
      borderClass: 'border-border',
    },
  };

  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded border font-semibold select-none
        ${sizeStyles[size]}
        ${config.bgClass}
        ${config.textClass}
        ${config.borderClass}
        ${className}
      `.trim()}
    >
      <span className="shrink-0">{config.icon}</span>
      <span>{displayLabel}</span>
    </span>
  );
};
