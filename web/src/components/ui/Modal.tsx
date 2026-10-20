'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Max width of the dialog panel. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Disable closing via backdrop click or Escape. */
  dismissible?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog primitive.
 *
 * The five modals in this app previously rendered as bare absolutely-positioned
 * divs: no `role="dialog"`, no `aria-modal`, no focus trap, no Escape
 * handling, and the page behind kept scrolling.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  dismissible = true,
  className = '',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [dismissible, onClose],
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown, true);

    // Move focus into the dialog on the next frame so the panel is mounted.
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      (focusable[0] ?? panel).focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink-950/55 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`w-full ${SIZE_CLASSES[size]} animate-fade-in-up overflow-hidden rounded-3xl border border-brand-blue-500/12 bg-white shadow-e3 focus:outline-none ${className}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-200/80 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-brand-blue-500/15 bg-brand-blue-50 text-brand-blue-600">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-[0.9375rem] font-extrabold tracking-tight text-ink-900">
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-ink-500">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {children && (
          <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        )}

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-200/80 bg-ink-50/60 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
