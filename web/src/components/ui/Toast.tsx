'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  tone?: ToastTone;
  onDismiss?: () => void;
  /** Auto-dismiss delay in ms. Set to 0 to disable. */
  duration?: number;
  className?: string;
}

const TONE_META: Record<
  ToastTone,
  { icon: React.ReactNode; surface: string; border: string; text: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
    surface: 'bg-brand-lime-400',
    border: 'border-black/10',
    text: 'text-black',
    iconColor: 'text-black',
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
    surface: 'bg-rose-500',
    border: 'border-rose-300',
    text: 'text-white',
    iconColor: 'text-white',
  },
  info: {
    icon: <Info className="h-4 w-4" aria-hidden="true" />,
    surface: 'bg-white',
    border: 'border-brand-blue-500/15',
    text: 'text-ink-900',
    iconColor: 'text-brand-blue-600',
  },
};

/**
 * A transient status message. Announced politely to screen readers and
 * dismissible by hand — the old toast had neither.
 */
export function Toast({
  message,
  tone = 'success',
  onDismiss,
  duration = 4000,
  className = '',
}: ToastProps) {
  React.useEffect(() => {
    if (!onDismiss || duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  const meta = TONE_META[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-2xl border px-4 py-3 font-mono text-[0.75rem] font-bold shadow-e3 ${meta.surface} ${meta.border} ${meta.text} ${className}`}
    >
      <span className={`mt-px shrink-0 ${meta.iconColor}`}>{meta.icon}</span>
      <span className="flex-1 leading-relaxed">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className={`-mr-1 shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100 ${meta.iconColor}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default Toast;
