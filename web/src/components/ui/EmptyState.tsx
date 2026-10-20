import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`surface-card flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-brand-blue-500/25 px-6 py-14 text-center ${className}`}
    >
      {icon && (
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-brand-blue-500/15 bg-brand-blue-50 text-brand-blue-500">
          {icon}
        </div>
      )}
      <h3 className="text-[0.9375rem] font-extrabold tracking-tight text-ink-900">
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-[0.8125rem] leading-relaxed text-ink-500">
          {description}
        </p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
