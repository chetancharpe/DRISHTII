import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const baseClasses = 'bg-surface-elevated animate-pulse rounded select-none';

  if (variant === 'card') {
    return (
      <div
        role="status"
        aria-label="Loading content..."
        className={`p-5 rounded-lg border border-border bg-surface flex flex-col gap-4 ${className}`}
        {...props}
      >
        <div className="w-1/3 h-5 bg-surface-elevated rounded animate-pulse" />
        <div className="w-full h-4 bg-surface-elevated rounded animate-pulse" />
        <div className="w-5/6 h-4 bg-surface-elevated rounded animate-pulse" />
        <div className="w-1/4 h-8 bg-surface-elevated rounded mt-2 animate-pulse" />
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }

  const variantClasses = {
    text: 'h-4 w-full rounded',
    rectangular: 'w-full h-24 rounded-md',
    circular: 'w-10 h-10 rounded-full',
  };

  const inlineStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={inlineStyle}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
