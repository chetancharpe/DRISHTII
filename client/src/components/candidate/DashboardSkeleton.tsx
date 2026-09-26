import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

export const DashboardSkeleton: React.FC = () => {
  const { preferences } = useAccessibility();
  const shimmerClass = preferences.reducedMotion === 'on' ? '' : 'animate-pulse';

  return (
    <div
      role="status"
      aria-label="Loading candidate dashboard preparation details"
      className="flex flex-col gap-6 w-full max-w-7xl mx-auto"
    >
      <span className="sr-only">Loading your candidate dashboard...</span>

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pb-6 border-b border-border">
        <div className="flex flex-col gap-2">
          <div className={`h-4 w-32 bg-surface-elevated rounded-full ${shimmerClass}`} />
          <div className={`h-8 w-64 bg-surface-elevated rounded-lg ${shimmerClass}`} />
          <div className={`h-4 w-80 bg-surface-elevated rounded ${shimmerClass}`} />
        </div>
        <div className={`h-10 w-28 bg-surface-elevated rounded-lg ${shimmerClass}`} />
      </div>

      {/* Next Action Banner Skeleton */}
      <div className={`p-6 rounded-2xl border border-border bg-surface flex flex-col gap-4 ${shimmerClass}`}>
        <div className="h-4 w-40 bg-surface-elevated rounded" />
        <div className="h-8 w-80 bg-surface-elevated rounded" />
        <div className="h-4 w-full bg-surface-elevated rounded-full" />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`p-4 rounded-xl border border-border bg-surface h-28 ${shimmerClass}`} />
        ))}
      </div>

      {/* Overview Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`p-4 rounded-xl border border-border bg-surface h-32 ${shimmerClass}`} />
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl border border-border bg-surface h-80 ${shimmerClass}`} />
        <div className={`p-6 rounded-xl border border-border bg-surface h-80 ${shimmerClass}`} />
      </div>
    </div>
  );
};
