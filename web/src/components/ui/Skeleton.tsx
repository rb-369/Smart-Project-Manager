import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tailwind width class, e.g. `w-24`. Defaults to full width. */
  width?: string;
  height?: string;
  rounded?: string;
}

/**
 * A calm, non-strobing placeholder. Deliberately avoids a shimmer sweep —
 * the app already had a documented preference for calm, static loading
 * states.
 */
export function Skeleton({
  width = 'w-full',
  height = 'h-3',
  rounded = 'rounded-md',
  className = '',
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`${width} ${height} ${rounded} bg-ink-200/70 ${className}`}
      {...rest}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? 'w-2/3' : 'w-full'}
          height="h-2.5"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-brand-blue-500/10 bg-white p-5 shadow-e1 ${className}`}
    >
      <Skeleton width="w-1/3" height="h-2.5" />
      <Skeleton width="w-4/5" height="h-5" className="mt-3" />
      <SkeletonText lines={2} className="mt-4" />
      <Skeleton width="w-full" height="h-1.5" rounded="rounded-full" className="mt-5" />
    </div>
  );
}

export default Skeleton;
