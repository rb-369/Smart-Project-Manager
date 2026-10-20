'use client';

import React from 'react';
import { ServerCrash, RotateCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Shown when a request fails. Before this existed, a failed load rendered a
 * bare line of red text with no way to recover.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data. The connection may be down or the request was rejected.',
  onRetry,
  retryLabel = 'Try again',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-3xl border border-rose-200 bg-rose-50/60 px-6 py-12 text-center ${className}`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-rose-200 bg-white text-rose-500 shadow-e1">
        <ServerCrash className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-[0.9375rem] font-extrabold tracking-tight text-ink-900">
        {title}
      </h3>
      <p className="max-w-sm text-[0.8125rem] leading-relaxed text-ink-600">
        {description}
      </p>
      {onRetry && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            iconLeft={<RotateCw className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
