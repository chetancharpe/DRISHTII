import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  initialFocusRef?: React.RefObject<HTMLElement>;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  initialFocusRef,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!isOpen) return;

    // 1. Store previous focused element to return focus on modal close
    previousFocusRef.current = document.activeElement as HTMLElement;

    // 2. Prevent body background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 3. Set focus inside modal
    const focusTarget = initialFocusRef?.current || modalRef.current;
    focusTarget?.focus();

    // 4. Keyboard Navigation: Escape to close & Tab-trap loop
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus on close
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose, initialFocusRef]);

  if (!isOpen) return null;

  const maxWidthStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`
          w-full ${maxWidthStyles[maxWidth]} bg-surface text-foreground
          rounded-lg border border-border-strong shadow-lg flex flex-col
          max-h-[90vh] overflow-hidden focus-visible:outline-none
        `.trim()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-surface-elevated">
          <div className="flex flex-col">
            <h2 id={titleId} className="text-xl font-bold text-foreground">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-foreground-muted mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 -mr-2 -mt-2 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-surface-elevated">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
