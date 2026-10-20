import React from 'react';

interface ProgressRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Track colour class. */
  trackClassName?: string;
  /** Progress colour class. */
  progressClassName?: string;
  /** Main readout rendered in the middle of the ring. */
  children?: React.ReactNode;
  className?: string;
  /** Announced to screen readers instead of the visual children. */
  label?: string;
}

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  trackClassName = 'text-ink-200',
  progressClassName = 'text-brand-blue-500',
  children,
  className = '',
  label,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={`relative inline-grid place-items-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${clamped}%`}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className={trackClassName}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${progressClassName} transition-[stroke-dashoffset] duration-700 ease-out-expo`}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
      )}
    </div>
  );
}

export default ProgressRing;
