import React, { useState, useId, useEffect } from 'react';

export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  // Escape key dismisses the tooltip
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const posStyles: Record<string, string> = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const child = React.cloneElement(children, {
    'aria-describedby': isVisible ? tooltipId : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      setIsVisible(true);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      setIsVisible(false);
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      setIsVisible(true);
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      setIsVisible(false);
    },
  });

  return (
    <div className="relative inline-flex items-center">
      {child}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`
            absolute ${posStyles[position]} z-tooltip px-3 py-1.5
            text-xs font-medium rounded-md bg-surface-elevated text-foreground
            border border-border-strong shadow-md whitespace-nowrap pointer-events-none
            ${className}
          `.trim()}
        >
          {content}
        </div>
      )}
    </div>
  );
};
